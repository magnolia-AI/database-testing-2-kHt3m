'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Todo, Category, Priority } from '@prisma/client'
import { createTodo, updateTodo } from '@/app/actions/todos'
import { useToast } from '@/hooks/use-toast'

type TodoWithCategory = Todo & {
  category: Category | null
}

interface TodoFormProps {
  categories: Category[]
  editingTodo?: TodoWithCategory | null
  onClose?: () => void
  trigger?: React.ReactNode
}

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
]

export function TodoForm({ categories, editingTodo, onClose, trigger }: TodoFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    categoryId: '',
    dueDate: undefined as Date | undefined
  })
  const { toast } = useToast()

  // Reset form when editing todo changes
  useEffect(() => {
    if (editingTodo) {
      setFormData({
        title: editingTodo.title,
        description: editingTodo.description || '',
        priority: editingTodo.priority,
        categoryId: editingTodo.categoryId || '',
        dueDate: editingTodo.dueDate ? new Date(editingTodo.dueDate) : undefined
      })
      setOpen(true)
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        categoryId: '',
        dueDate: undefined
      })
    }
  }, [editingTodo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsSubmitting(true)
    try {
      const submitFormData = new FormData()
      submitFormData.append('title', formData.title.trim())
      submitFormData.append('description', formData.description.trim())
      submitFormData.append('priority', formData.priority)
      if (formData.categoryId) {
        submitFormData.append('categoryId', formData.categoryId)
      }
      if (formData.dueDate) {
        submitFormData.append('dueDate', formData.dueDate.toISOString())
      }

      if (editingTodo) {
        submitFormData.append('id', editingTodo.id)
        await updateTodo(submitFormData)
        toast({
          title: 'Task updated',
          description: 'Your task has been successfully updated',
        })
      } else {
        await createTodo(submitFormData)
        toast({
          title: 'Task created',
          description: 'Your new task has been added to the list',
        })
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        categoryId: '',
        dueDate: undefined
      })
      setOpen(false)
      onClose?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: editingTodo ? 'Failed to update task' : 'Failed to create task',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      onClose?.()
    }
  }

  const selectedPriority = priorityOptions.find(p => p.value === formData.priority)
  const selectedCategory = categories.find(c => c.id === formData.categoryId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingTodo ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What needs to be done?"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          {/* Priority and Category Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedPriority && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn('text-xs', selectedPriority.color)}>
                          {selectedPriority.label}
                        </Badge>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn('text-xs', priority.color)}>
                          {priority.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category">
                    {selectedCategory && (
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: selectedCategory.color,
                            color: selectedCategory.color 
                          }}
                        >
                          {selectedCategory.name}
                        </Badge>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: category.color,
                            color: category.color 
                          }}
                        >
                          {category.name}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? format(formData.dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                  initialFocus
                />
                {formData.dueDate && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, dueDate: undefined }))}
                      className="w-full"
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  {editingTodo ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingTodo ? 'Update Task' : 'Create Task'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
