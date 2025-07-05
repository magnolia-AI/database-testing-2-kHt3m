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

    await prisma.todo.create({
      data: {
        ...validatedFields.data,
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
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error toggling todo:', error)
    return { success: false, error: 'Failed to toggle todo' }
  }
}

export async function getTodoStats() {
  try {
    const totalCount = await prisma.todo.count()
    const completedCount = await prisma.todo.count({ where: { completed: true } })
    return { success: true, totalCount, completedCount }
  } catch (error) {
    console.error('Error fetching todo stats:', error)
    return { success: false, error: 'Failed to fetch todo stats' }
  }
}

export async function updateTodo(formData: FormData) {
  try {
    const validatedFields = updateTodoSchema.safeParse({
      id: formData.get('id'),
      title: formData.get('title'),
      description: formData.get('description'),
      completed: formData.get('completed') === 'true',
      categoryId: formData.get('categoryId'),
      priority: formData.get('priority'),
      dueDate: formData.get('dueDate'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { id, ...dataToUpdate } = validatedFields.data

    await prisma.todo.update({
      where: { id },
      data: dataToUpdate,
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error updating todo:', error)
    return { success: false, error: 'Failed to update todo' }
  }
}

export async function deleteTodo(id: string) {
    try {
        await prisma.todo.delete({
            where: { id },
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting todo:', error);
        return { success: false, error: 'Failed to delete todo' };
    }
}

export async function reorderTodos(
  draggedId: string,
  droppedId: string
) {
  try {
    const draggedTodo = await prisma.todo.findUnique({ where: { id: draggedId } })
    const droppedTodo = await prisma.todo.findUnique({ where: { id: droppedId } })

    if (!draggedTodo || !droppedTodo) {
      throw new Error('Could not find one or both of the todos to reorder.')
    }

    // If the todos are in the same completion status
    if (draggedTodo.completed === droppedTodo.completed) {
      const startOrder = Math.min(draggedTodo.order, droppedTodo.order)
      const endOrder = Math.max(draggedTodo.order, droppedTodo.order)

      if (draggedTodo.order < droppedTodo.order) {
        // Dragging down
        await prisma.$transaction([
          // Shift items up
          prisma.todo.updateMany({
            where: {
              completed: draggedTodo.completed,
              order: { gt: startOrder, lte: endOrder },
            },
            data: { order: { decrement: 1 } },
          }),
          // Place dragged item
          prisma.todo.update({
            where: { id: draggedId },
            data: { order: endOrder },
          }),
        ])
      } else {
        // Dragging up
        await prisma.$transaction([
          // Shift items down
          prisma.todo.updateMany({
            where: {
              completed: draggedTodo.completed,
              order: { gte: endOrder, lt: startOrder },
            },
            data: { order: { increment: 1 } },
          }),
          // Place dragged item
          prisma.todo.update({
            where: { id: draggedId },
            data: { order: endOrder },
          }),
        ])
      }
    } else {
      // Moving between completed and incomplete lists
      const oldOrder = draggedTodo.order
      const newCompletedStatus = droppedTodo.completed
      const newOrder = droppedTodo.order

      // 1. Decrement order of all items in the old list that were after the dragged item
      await prisma.todo.updateMany({
        where: {
          completed: draggedTodo.completed,
          order: { gt: oldOrder },
        },
        data: { order: { decrement: 1 } },
      })

      // 2. Increment order of all items in the new list at or after the drop position
      await prisma.todo.updateMany({
        where: {
          completed: newCompletedStatus,
          order: { gte: newOrder },
        },
        data: { order: { increment: 1 } },
      })

      // 3. Update the dragged todo itself
      await prisma.todo.update({
        where: { id: draggedId },
        data: {
          completed: newCompletedStatus,
          order: newOrder,
        },
      })
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error reordering todos:', error)
    return { success: false, error: 'Failed to reorder todos' }
  }
}

