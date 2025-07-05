'use client'

import { CheckCircle, Circle, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface TodoStatsProps {
  total: number
  completed: number
  pending: number
  overdue: number
}

export function TodoStats({ total, completed, pending, overdue }: TodoStatsProps) {
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const stats = [
    {
      label: 'Total',
      value: total,
      icon: Circle,
      color: 'text-muted-foreground'
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Pending',
      value: pending,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {completed} of {total} tasks completed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
