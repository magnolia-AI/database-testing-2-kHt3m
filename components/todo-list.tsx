'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { Todo, Category } from '@prisma/client'
import { TodoItem } from './todo-item'
import { reorderTodos } from '@/app/actions/todos'
import { useToast } from '@/hooks/use-toast'

type TodoWithCategory = Todo & {
  category: Category | null
}

interface TodoListProps {
  todos: TodoWithCategory[]
  onEdit: (todo: TodoWithCategory) => void
}

export function TodoList({ todos, onEdit }: TodoListProps) {
  const [items, setItems] = useState(todos)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update items when todos prop changes
  useEffect(() => {
    setItems(todos)
  }, [todos])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)

    try {
      // Create updates array with new order values
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order: index
      }))

      await reorderTodos(updates)
      
      toast({
        title: 'Tasks reordered',
        description: 'Task order has been saved',
      })
    } catch (error) {
      // Revert on error
      setItems(items)
      toast({
        title: 'Error',
        description: 'Failed to save new task order',
        variant: 'destructive',
      })
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <div className="text-lg font-medium mb-2">No tasks yet</div>
          <div className="text-sm">Create your first task to get started!</div>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}


