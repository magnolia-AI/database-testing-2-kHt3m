'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Priority } from '@prisma/client'

// Validation schemas
const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  categoryId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable().optional()
  ),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
})

const updateTodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  categoryId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable().optional()
  ),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
})

const reorderTodosSchema = z.object({
  todoId: z.string(),
  newOrder: z.number(),
})

// Todo actions
export async function getTodos() {
  try {
    const todos = await prisma.todo.findMany({
      include: {
        category: true,
      },
      orderBy: [
        { completed: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })
    return { success: true, todos }
  } catch (error) {
    console.error('Error fetching todos:', error)
    return { success: false, error: 'Failed to fetch todos' }
  }
}

export async function createTodo(formData: FormData) {
  try {
    const validatedFields = createTodoSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      categoryId: formData.get('categoryId'),
      priority: formData.get('priority') || Priority.MEDIUM,
      dueDate: formData.get('dueDate'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    // Get the highest order number to place new todo at the end
    const maxOrder = await prisma.todo.aggregate({
      _max: {
        order: true,
      },
    })

    const newOrder = (maxOrder._max.order ?? 0) + 1

    const { title, description, categoryId, priority, dueDate } = validatedFields.data

    await prisma.todo.create({
      data: {
        title,
        description,
        categoryId,
        priority,
        dueDate,
        order: newOrder,
      },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error creating todo:', error)
    return { success: false, error: 'Failed to create todo' }
  }
}


export async function toggleTodo(id: string, completed: boolean) {
  try {
    await prisma.todo.update({
      where: { id },
      data: { completed },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error toggling todo:', error);
    return { success: false, error: 'Failed to toggle todo' };
  }
}

export async function getTodoStats() {
  try {
    const totalTodos = await prisma.todo.count();
    const completedTodos = await prisma.todo.count({
      where: { completed: true },
    });
    return { success: true, totalTodos, completedTodos };
  } catch (error) {
    console.error('Error fetching todo stats:', error);
    return { success: false, error: 'Failed to fetch todo stats' };
  }
}

export async function updateTodo(formData: FormData) {
  try {
    const updateData = {
      id: formData.get('id'),
      title: formData.get('title'),
      description: formData.get('description'),
      completed: formData.get('completed') === 'true',
      categoryId: formData.get('categoryId'),
      priority: formData.get('priority'),
      dueDate: formData.get('dueDate'),
    }

    const validatedFields = updateTodoSchema.safeParse(updateData)

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }
    
    const data = validatedFields.data
    if (data.categoryId === undefined) {
      data.categoryId = null
    }

    const todo = await prisma.todo.update({
      where: { id: validatedFields.data.id },
      data,
    })

    revalidatePath('/')
    return { success: true, todo }
  } catch (error) {
    console.error('Error updating todo:', error)
    return { success: false, error: 'Failed to update todo' }
  }
}

export async function deleteTodo(id: string) {
  try {
    await prisma.todo.delete({
      where: { id },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting todo:', error)
    return { success: false, error: 'Failed to delete todo' }
  }
}

