'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/toaster'
import { TodoForm } from '@/components/todo-form'
import { TodoList } from '@/components/todo-list'
import { TodoFilters, FilterStatus } from '@/components/todo-filters'
import { TodoStats } from '@/components/todo-stats'
import { CategoryManager } from '@/components/category-manager'
import { getTodos, getTodoStats } from '@/app/actions/todos'
import { getCategories } from '@/app/actions/categories'
import { Todo, Category, Priority } from '@prisma/client'

type TodoWithCategory = Todo & {
  category: Category | null
}

type CategoryWithCount = Category & {
  _count: {
    todos: number
  }
}

interface TodoStats {
  total: number
  completed: number
  pending: number
  overdue: number
}

export default function TodoApp() {
  const [todos, setTodos] = useState<TodoWithCategory[]>([])
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [stats, setStats] = useState<TodoStats>({ total: 0, completed: 0, pending: 0, overdue: 0 })
  const [editingTodo, setEditingTodo] = useState<TodoWithCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all')

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [todosData, categoriesData, statsData] = await Promise.all([
        getTodos(),
        getCategories(),
        getTodoStats()
      ])
      setTodos(todosData)
      setCategories(categoriesData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh data when todos change
  useEffect(() => {
    const interval = setInterval(loadData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Filter todos based on current filters
  const filteredTodos = useMemo(() => {
    let filtered = todos

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query) ||
        todo.category?.name.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(todo => {
        switch (statusFilter) {
          case 'completed':
            return todo.completed
          case 'pending':
            return !todo.completed
          case 'overdue':
            return !todo.completed && todo.dueDate && new Date(todo.dueDate) < now
          default:
            return true
        }
      })
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(todo => todo.priority === priorityFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(todo => todo.categoryId === categoryFilter)
    }

    return filtered
  }, [todos, searchQuery, statusFilter, priorityFilter, categoryFilter])

  const handleEditTodo = (todo: TodoWithCategory) => {
    setEditingTodo(todo)
  }

  const handleCloseEdit = () => {
    setEditingTodo(null)
    loadData() // Refresh data after edit
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading your tasks...</div>
          <div className="text-sm text-muted-foreground mt-1">Please wait a moment</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground mt-1">
              Stay organized and get things done
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TodoForm
              categories={categories}
              editingTodo={editingTodo}
              onClose={handleCloseEdit}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              }
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Manage Categories</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <CategoryManager categories={categories} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <TodoStats
            total={stats.total}
            completed={stats.completed}
            pending={stats.pending}
            overdue={stats.overdue}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <TodoFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  priorityFilter={priorityFilter}
                  onPriorityFilterChange={setPriorityFilter}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  categories={categories}
                  totalCount={todos.length}
                  filteredCount={filteredTodos.length}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Tasks ({filteredTodos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TodoList
                  todos={filteredTodos}
                  onEdit={handleEditTodo}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden form for editing */}
      {editingTodo && (
        <TodoForm
          categories={categories}
          editingTodo={editingTodo}
          onClose={handleCloseEdit}
        />
      )}

      <Toaster />
    </div>
  )
}
