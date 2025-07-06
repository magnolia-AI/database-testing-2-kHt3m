import prisma from '../lib/prisma'; // Adjust path if necessary, assuming prisma client is in lib/prisma

async function main() {
  console.log('Start seeding...');

  // Example: Seed a Todo item
  // Ensure your schema has a Todo model
  try {
    const todo = await prisma.todo.upsert({
      where: { id: 1 }, // Use a unique identifier for upsert
      update: {},
      create: {
        title: 'Learn Prisma Seeding',
        description: 'Understand how to use prisma db seed command.',
        completed: false,
      },
    });
    console.log(`Created or updated todo with id: ${todo.id}`);
  } catch (error) {
    console.error('Error seeding Todo:', error);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

