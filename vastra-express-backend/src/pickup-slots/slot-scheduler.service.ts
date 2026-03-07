import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * SlotSchedulerService
 * ---------------------
 * Runs daily at 00:01 IST (18:31 UTC previous day) and generates
 * half-hour pickup slots for every active facility from 10:00 to 21:00.
 *
 * Business Rules:
 *  - Slots are generated for TOMORROW (today + 1) to give customers advance booking
 *  - Working hours: 10:00 – 21:00 (configurable via SLOT_START_HOUR / SLOT_END_HOUR env)
 *  - Slot interval: 30 minutes
 *  - Default capacity: 10 orders per slot (configurable via SLOT_DEFAULT_CAPACITY env)
 *  - Duplicate prevention: skip if a slot already exists for that facility+date+startTime
 */
@Injectable()
export class SlotSchedulerService {
  private readonly logger = new Logger(SlotSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every day at 00:01 IST (UTC+5:30 = 18:31 UTC)
   * Generates slots for the next day.
   */
  @Cron('1 18 * * *', { timeZone: 'Asia/Kolkata' })
  async generateDailySlots() {
    this.logger.log('⏰ Running daily slot generation...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    await this.generateSlotsForDate(new Date(`${tomorrowStr}T12:00:00+05:30`));
  }

  /**
   * Also generate today's slots on server startup (in case server was down at midnight)
   * Runs once, 5 seconds after the app starts (handled via onModuleInit).
   */
  async onModuleInit() {
    this.logger.log('🚀 Bootstrapping: generating today & tomorrow slots...');
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    await this.generateSlotsForDate(new Date(`${todayStr}T12:00:00+05:30`));
    await this.generateSlotsForDate(new Date(`${tomorrowStr}T12:00:00+05:30`));
  }

  /**
   * Core slot generation logic for a given date.
   * Exported so admin can manually trigger for a specific date.
   *
   * Uses createMany + skipDuplicates (backed by DB unique constraint on
   * facilityId+slotDate+startTime) — fully atomic, safe against hot-reload
   * triggering onModuleInit multiple times concurrently.
   */
  async generateSlotsForDate(date: Date): Promise<{ created: number; skipped: number }> {
    const startHour = parseInt(process.env.SLOT_START_HOUR ?? '10', 10); // 10:00
    const endHour   = parseInt(process.env.SLOT_END_HOUR   ?? '21', 10); // 21:00
    const capacity  = parseInt(process.env.SLOT_DEFAULT_CAPACITY ?? '10', 10);

    // Normalise to a plain DATE string then back to midnight UTC so Prisma
    // stores the correct calendar date regardless of server timezone.
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // 'YYYY-MM-DD'
    const slotDate = new Date(`${dateStr}T00:00:00.000Z`); // midnight UTC

    // Get all active facilities
    const facilities = await this.prisma.facility.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    // Build every 30-min slot from startHour to endHour
    const timeSlots: { startTime: string; endTime: string }[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (const minute of [0, 30]) {
        const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const endMinute  = minute + 30;
        const endHourVal = endMinute >= 60 ? hour + 1 : hour;
        const endMin     = endMinute >= 60 ? endMinute - 60 : endMinute;
        const endTime    = `${String(endHourVal).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
        if (endHourVal > endHour) continue; // don't overflow past endHour
        timeSlots.push({ startTime, endTime });
      }
    }

    let totalCreated = 0;

    for (const facility of facilities) {
      const data = timeSlots.map(({ startTime, endTime }) => ({
        facilityId: facility.id,
        slotDate,
        startTime,
        endTime,
        maxCapacity: capacity,
        currentBookings: 0,
        isActive: true,
      }));

      // skipDuplicates relies on the @@unique([facilityId, slotDate, startTime]) constraint.
      // This is a single atomic DB operation — safe against concurrent onModuleInit calls.
      const result = await this.prisma.pickupSlot.createMany({
        data,
        skipDuplicates: true,
      });
      totalCreated += result.count;
    }

    const skipped = facilities.length * timeSlots.length - totalCreated;
    this.logger.log(
      `📅 Slots for ${dateStr}: created=${totalCreated}, skipped=${skipped} (${facilities.length} facilities)`,
    );

    return { created: totalCreated, skipped };
  }
}
