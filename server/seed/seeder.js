import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Token from '../models/Token.js';
import QueueCounter from '../models/QueueCounter.js';
import ServiceRecord from '../models/ServiceRecord.js';
import { getCollegeDateKey, formatTokenNumber } from '../utils/dateUtils.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('[Seeder] Checking and seeding default data...');

    // 1. Seed & Synchronize Admin User
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@college.edu').toLowerCase().trim();
    const adminName = process.env.ADMIN_NAME || 'Raghavendra Shetty';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Raghu@123';

    // Find any existing admin user or user matching this email
    let adminUser = await User.findOne({
      $or: [{ role: 'admin' }, { email: adminEmail }],
    }).select('+password');

    if (!adminUser) {
      console.log(`[Seeder] Creating admin user: ${adminName} (${adminEmail})...`);
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true,
      });
      console.log(`[Seeder] Admin user created.`);
    } else {
      adminUser.name = adminName;
      adminUser.email = adminEmail;
      adminUser.role = 'admin';
      adminUser.password = adminPassword; // Will trigger pre('save') bcrypt hashing!
      adminUser.isActive = true;
      await adminUser.save();
      console.log(`[Seeder] Synchronized admin user: ${adminName} (${adminEmail}) with password from .env!`);
    }

    let staffUser = await User.findOne({ role: 'staff' });
    let studentUser = await User.findOne({ role: 'student' });
    let studentUser2 = await User.findOne({ email: 'priya@college.edu' });

    if (!staffUser) {
      staffUser = await User.create({
        name: 'Anita Sharma (Staff Officer)',
        email: 'staff@college.edu',
        password: 'staff123',
        role: 'staff',
      });
    }

    if (!studentUser) {
      studentUser = await User.create({
        name: 'Rahul Verma (MCA 2026)',
        email: 'student@college.edu',
        password: 'student123',
        role: 'student',
      });
    }

    if (!studentUser2) {
      studentUser2 = await User.create({
        name: 'Priya Patel (BTech CS)',
        email: 'priya@college.edu',
        password: 'student123',
        role: 'student',
      });
    }

    // 2. Seed Services if none exist
    const serviceCount = await Service.countDocuments();
    let feeService, examService, certService, admService;

    if (serviceCount === 0) {
      console.log('[Seeder] Creating standard college services...');
      feeService = await Service.create({
        name: 'Fee Counter & Accounts',
        prefix: 'FEE',
        description: 'Semester fees, hostel dues, scholarship verification and receipts.',
        averageServiceTime: 4,
        counterLocation: 'Counter 01, Ground Floor Admin Wing',
        isActive: true,
      });

      examService = await Service.create({
        name: 'Examination Cell',
        prefix: 'EXAM',
        description: 'Hall tickets, re-evaluation forms, grade card inquiries and backlog verification.',
        averageServiceTime: 5,
        counterLocation: 'Counter 02, Examination Block',
        isActive: true,
      });

      certService = await Service.create({
        name: 'Certificate & Transcript Section',
        prefix: 'CERT',
        description: 'Bonafide certificates, transfer certificates, provisional degree and transcripts.',
        averageServiceTime: 6,
        counterLocation: 'Counter 03, First Floor Student Affairs',
        isActive: true,
      });

      admService = await Service.create({
        name: 'Admissions & Student Welfare',
        prefix: 'ADM',
        description: 'New admissions, document submission, identity cards and welfare guidance.',
        averageServiceTime: 5,
        counterLocation: 'Counter 04, Central Academic Hall',
        isActive: true,
      });
      console.log('[Seeder] Services created successfully.');
    } else {
      feeService = await Service.findOne({ prefix: 'FEE' });
      examService = await Service.findOne({ prefix: 'EXAM' });
      certService = await Service.findOne({ prefix: 'CERT' });
      admService = await Service.findOne({ prefix: 'ADM' });
    }

    // 3. Seed Today's realistic tokens if none exist for today
    const today = getCollegeDateKey();
    const tokenCountToday = await Token.countDocuments({ dateKey: today });

    if (tokenCountToday === 0 && feeService && studentUser && staffUser) {
      console.log(`[Seeder] Seeding initial live tokens for today (${today})...`);

      // Token 1: Already Completed earlier
      const t1 = await Token.create({
        tokenNumber: formatTokenNumber(feeService.prefix, 1),
        sequence: 1,
        service: feeService._id,
        student: studentUser2._id,
        dateKey: today,
        status: 'completed',
        calledAt: new Date(Date.now() - 30 * 60 * 1000),
        startedAt: new Date(Date.now() - 25 * 60 * 1000),
        completedAt: new Date(Date.now() - 20 * 60 * 1000),
        servedBy: staffUser._id,
      });

      await ServiceRecord.create({
        token: t1._id,
        service: feeService._id,
        staff: staffUser._id,
        durationSeconds: 300,
        serviceDate: new Date(Date.now() - 20 * 60 * 1000),
        dateKey: today,
      });

      // Token 2: Currently Serving
      await Token.create({
        tokenNumber: formatTokenNumber(feeService.prefix, 2),
        sequence: 2,
        service: feeService._id,
        student: studentUser._id,
        dateKey: today,
        status: 'serving',
        calledAt: new Date(Date.now() - 5 * 60 * 1000),
        startedAt: new Date(Date.now() - 2 * 60 * 1000),
        servedBy: staffUser._id,
      });

      // Token 3: Waiting
      await Token.create({
        tokenNumber: formatTokenNumber(feeService.prefix, 3),
        sequence: 3,
        service: feeService._id,
        student: studentUser2._id,
        dateKey: today,
        status: 'waiting',
      });

      // Update counter for FEE
      await QueueCounter.findOneAndUpdate(
        { service: feeService._id, dateKey: today },
        { lastSequence: 3 },
        { upsert: true }
      );

      // Exam Cell Token 1: Waiting
      if (examService) {
        await Token.create({
          tokenNumber: formatTokenNumber(examService.prefix, 1),
          sequence: 1,
          service: examService._id,
          student: studentUser._id,
          dateKey: today,
          status: 'waiting',
        });

        await QueueCounter.findOneAndUpdate(
          { service: examService._id, dateKey: today },
          { lastSequence: 1 },
          { upsert: true }
        );
      }

      console.log('[Seeder] Live queue initial tokens seeded.');
    }

    console.log('[Seeder] Seeding check complete.');
  } catch (err) {
    console.error('[Seeder] Error seeding data:', err);
  }
};
