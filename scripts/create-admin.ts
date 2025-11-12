import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminAccount() {
  const email = process.env.ADMIN_EMAIL || 'admin@linepointer.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const username = 'admin';

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('❌ Admin account already exists with email:', email);
      console.log('User ID:', existingAdmin.id);
      console.log('Username:', existingAdmin.username);
      console.log('Role:', existingAdmin.role);
      console.log('Subscription:', existingAdmin.subscriptionTier);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        subscriptionTier: 'PREMIUM', // Give admin premium access
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        emailVerified: new Date(),
      },
    });

    console.log('✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Username:', username);
    console.log('User ID:', admin.id);
    console.log('Role:', admin.role);
    console.log('Subscription:', admin.subscriptionTier);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Please save these credentials securely!');
  } catch (error) {
    console.error('Error creating admin account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminAccount()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
