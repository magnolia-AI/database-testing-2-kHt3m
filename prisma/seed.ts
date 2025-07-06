import prisma from '../lib/prisma';

async function main() {
  console.log('Start seeding...');

  // Seed a Category
  try {
    const category = await prisma.category.upsert({
      where: { name: 'Work' },
      update: {},
      create: {
        name: 'Work',
        color: '#ef4444', // Red color
      },
    });
    console.log(`Created or updated category with id: ${category.id}`);
  } catch (error) {
    console.error('Error seeding Category:', error);
  }

  // Seed a Todo item, linking it to the 'Work' category if it exists
  try {
    const workCategory = await prisma.category.findUnique({ where: { name: 'Work' } });

    const todo = await prisma.todo.create({
      data: {
        title: 'Complete Project Report',
        description: 'Finish the quarterly project report for the team meeting.',
        completed: false,
        priority: 'HIGH',
        order: 1,
        categoryId: workCategory?.id, // Link to the 'Work' category
      },
    });
    console.log(`Created todo with id: ${todo.id}`);
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

