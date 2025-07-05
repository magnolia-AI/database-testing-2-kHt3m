'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
})

const updateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
})

// Category actions
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { todos: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return { success: true, categories }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, error: 'Failed to fetch categories' }
  }
}

export async function createCategory(formData: FormData) {
  try {
    const validatedFields = createCategorySchema.safeParse({
      name: formData.get('name'),
      color: formData.get('color'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const category = await prisma.category.create({
      data: validatedFields.data,
      include: {
        _count: {
          select: { todos: true },
        },
      },
    })

    revalidatePath('/')
    return { success: true, category }
  } catch (error) {
    console.error('Error creating category:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'Category name already exists' }
    }
    return { success: false, error: 'Failed to create category' }
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const validatedFields = updateCategorySchema.safeParse({
      id: formData.get('id'),
      name: formData.get('name'),
      color: formData.get('color'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { id, ...updateData } = validatedFields.data
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { todos: true },
        },
      },
    })

    revalidatePath('/')
    return { success: true, category }
  } catch (error) {
    console.error('Error updating category:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'Category name already exists' }
    }
    return { success: false, error: 'Failed to update category' }
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    // First, update all todos in this category to have no category
    await prisma.todo.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    })

    // Then delete the category
    await prisma.category.delete({
      where: { id: categoryId },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}
