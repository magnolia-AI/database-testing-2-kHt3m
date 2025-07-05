'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Calendar, Clock, Edit2, GripVertical, MoreHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Todo, Category, Priority } from '@prisma/client'
import { toggleTodoComplete, deleteTodo } from '@/app/actions/todos'
import { useToast } from '@/hooks/use-toast'

type TodoWithCategory = Todo & {
  category: Category | null
}

interface TodoItemProps {
  todo: TodoWithCategory
  onEdit: (todo: TodoWithCategory) => void
}

const priorityColors = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

const priorityLabels = {
  LOW: 'Low',
  MEDIUM: 'Medium', 
  HIGH: 'High',
  URGENT: 'Urgent'
}

export function TodoItem({ todo, onEdit }: TodoItemProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleToggleComplete = async () => {
    setIsToggling(true)
    try {
      await toggleTodoComplete(todo.id)
      toast({
        title: todo.completed ? 'Task marked as incomplete' : 'Task completed!',
        description: todo.completed ? 'Task moved back to pending' : 'Great job on completing this task',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      })
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteTodo(todo.id)
      toast({
        title: 'Task deleted',
        description: 'Task has been permanently removed',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group transition-all duration-200 hover:shadow-md',
        isDragging && 'opacity-50 rotate-2 shadow-lg',
        todo.completed && 'opacity-75',
        isOverdue && 'border-red-200 dark:border-red-800'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Checkbox */}
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggleComplete}
            disabled={isToggling}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'font-medium text-sm leading-5',
                  todo.completed && 'line-through text-muted-foreground'
                )}>
                  {todo.title}
                </h3>
                {todo.description && (
                  <p className={cn(
                    'text-sm text-muted-foreground mt-1',
                    todo.completed && 'line-through'
                  )}>
                    {todo.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(todo)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Priority */}
              <Badge variant="secondary" className={cn('text-xs', priorityColors[todo.priority])}>
                {priorityLabels[todo.priority]}
              </Badge>

              {/* Category */}
              {todo.category && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: todo.category.color,
                    color: todo.category.color 
                  }}
                >
                  {todo.category.name}
                </Badge>
              )}

              {/* Due Date */}
              {todo.dueDate && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                )}>
                  {isOverdue ? (
                    <Clock className="h-3 w-3" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  <span>
                    {format(new Date(todo.dueDate), 'MMM d, yyyy')}
                  </span>
                  {isOverdue && (
                    <span className="font-medium">Overdue</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
