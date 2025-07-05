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

    const lastTodo = await prisma.todo.findFirst({
      orderBy: { order: 'desc' },
    })

    const data = {
      ...validatedFields.data,
      order: lastTodo ? lastTodo.order + 1 : 0,
    }
    
    if (data.categoryId === undefined) {
      data.categoryId = null
    }

    const todo = await prisma.todo.create({ data })

    revalidatePath('/')
    return { success: true, todo }
  } catch (error) {
    console.error('Error creating todo:', error)
    return { success: false, error: 'Failed to create todo' }
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

export async function reorderTodos(
  todoId: string,
  newOrder: number,
) {
  try {
    const validatedFields = reorderTodosSchema.safeParse({ todoId, newOrder })
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { todoId: id, newOrder: order } = validatedFields.data

    // Get the current todo to find its old order
    const currentTodo = await prisma.todo.findUnique({ where: { id } })
    if (!currentTodo) {
      return { success: false, error: 'Todo not found' }
    }
    const oldOrder = currentTodo.order

    // Determine the range of todos to update
    if (order > oldOrder) {
      // Moving down: decrement order of todos between old and new order
      await prisma.todo.updateMany({
        where: {
          order: {
            gt: oldOrder,
            lte: order,
          },
          id: { not: id },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      })
    } else {
      // Moving up: increment order of todos between new and old order
      await prisma.todo.updateMany({
        where: {
          order: {
            gte: order,
            lt: oldOrder,
          },
          id: { not: id },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      })
    }

    // Update the dragged todo's order
    await prisma.todo.update({
      where: { id },
      data: { order },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error reordering todos:', error)
    return { success: false, error: 'Failed to reorder todos' }
  }
}

