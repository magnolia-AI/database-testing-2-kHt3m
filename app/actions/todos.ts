'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Priority } from '@prisma/client'

// Validation schemas
const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
})

const updateTodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  categoryId: z.string().optional(),
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
      categoryId: formData.get('categoryId') || undefined,
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
    const lastTodo = await prisma.todo.findFirst({
      orderBy: { order: 'desc' },
    })

    const data = {
      ...validatedFields.data,
      order: (lastTodo?.order || 0) + 1,
    }
    
    // If categoryId is undefined, set it to null
    if (data.categoryId === undefined) {
      data.categoryId = null
    }
    
    const todo = await prisma.todo.create({
      data,
      include: {
        category: true,
      },
    })

    revalidatePath('/')
    return { success: true, todo }
  } catch (error) {
    console.error('Error creating todo:', error)
    return { success: false, error: 'Failed to create todo' }
  }
}

export async function updateTodo(formData: FormData) {
  try {
    const validatedFields = updateTodoSchema.safeParse({
      id: formData.get('id'),
      title: formData.get('title'),
      description: formData.get('description'),
      completed: formData.get('completed') === 'true',
      categoryId: formData.get('categoryId') || undefined,
      priority: formData.get('priority'),
      dueDate: formData.get('dueDate'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { id, ...updateData } = validatedFields.data
    
    // If categoryId is undefined, set it to null
    if (updateData.categoryId === undefined) {
      updateData.categoryId = null
    }
    
    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    })

    revalidatePath('/')
    return { success: true, todo }
  } catch (error) {
    console.error('Error updating todo:', error)
    return { success: false, error: 'Failed to update todo' }
  }
}

export async function deleteTodo(todoId: string) {
  try {
    await prisma.todo.delete({
      where: { id: todoId },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting todo:', error)
    return { success: false, error: 'Failed to delete todo' }
  }
}

export async function toggleTodoComplete(todoId: string) {
  try {
    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
    })

    if (!todo) {
      return { success: false, error: 'Todo not found' }
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: todoId },
      data: { completed: !todo.completed },
      include: {
        category: true,
      },
    })

    revalidatePath('/')
    return { success: true, todo: updatedTodo }
  } catch (error) {
    console.error('Error toggling todo:', error)
    return { success: false, error: 'Failed to toggle todo' }
  }
}

export async function reorderTodos(updates: { id: string; order: number }[]) {
  try {
    // Use a transaction to update all orders atomically
    await prisma.$transaction(
      updates.map(({ id, order }) =>
        prisma.todo.update({
          where: { id },
          data: { order },
        })
      )
    )

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error reordering todos:', error)
    return { success: false, error: 'Failed to reorder todos' }
  }
}

// Get todo statistics
export async function getTodoStats() {
  try {
    const [total, completed, pending, overdue] = await Promise.all([
      prisma.todo.count(),
      prisma.todo.count({ where: { completed: true } }),
      prisma.todo.count({ where: { completed: false } }),
      prisma.todo.count({
        where: {
          completed: false,
          dueDate: {
            lt: new Date(),
          },
        },
      }),
    ])

    return {
      success: true,
      stats: { total, completed, pending, overdue },
    }
  } catch (error) {
    console.error('Error fetching todo stats:', error)
    return { success: false, error: 'Failed to fetch stats' }
  }
}



