'use client'

import { Search, Filter, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Category, Priority } from '@prisma/client'
import { cn } from '@/lib/utils'

export type FilterStatus = 'all' | 'pending' | 'completed' | 'overdue'

interface TodoFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: FilterStatus
  onStatusFilterChange: (status: FilterStatus) => void
  priorityFilter: Priority | 'all'
  onPriorityFilterChange: (priority: Priority | 'all') => void
  categoryFilter: string | 'all'
  onCategoryFilterChange: (categoryId: string | 'all') => void
  categories: Category[]
  totalCount: number
  filteredCount: number
}

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
]

export function TodoFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  totalCount,
  filteredCount
}: TodoFiltersProps) {
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'

  const clearAllFilters = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onPriorityFilterChange('all')
    onCategoryFilterChange('all')
  }

  const selectedPriority = priorityOptions.find(p => p.value === priorityFilter)
  const selectedCategory = categories.find(c => c.id === categoryFilter)

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as FilterStatus)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Advanced Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Priority Filter */}
        <Select
          value={priorityFilter}
          onValueChange={(value) => onPriorityFilterChange(value as Priority | 'all')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue>
              {selectedPriority?.value === 'all' ? (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  All Priorities
                </div>
              ) : (
                selectedPriority && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Badge variant="secondary" className={cn('text-xs', selectedPriority.color)}>
                      {selectedPriority.label}
                    </Badge>
                  </div>
                )
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.value === 'all' ? (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {priority.label}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={cn('text-xs', priority.color)}>
                      {priority.label}
                    </Badge>
                  </div>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={categoryFilter}
          onValueChange={(value) => onCategoryFilterChange(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue>
              {categoryFilter === 'all' ? (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  All Categories
                </div>
              ) : (
                selectedCategory && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
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
                )
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                All Categories
              </div>
            </SelectItem>
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

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearAllFilters} className="whitespace-nowrap">
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} tasks
        </div>
      )}
    </div>
  )
}
