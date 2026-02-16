import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

const statsCardVariants = cva(
    "relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md",
    {
        variants: {
            variant: {
                default: "bg-blue-50 border-blue-100 text-blue-900",
                success: "bg-emerald-50 border-emerald-100 text-emerald-900",
                warning: "bg-amber-50 border-amber-100 text-amber-900",
                destructive: "bg-rose-50 border-rose-100 text-rose-900",
                neutral: "bg-gray-50 border-gray-100 text-gray-900",
                purple: "bg-purple-50 border-purple-100 text-purple-900",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const iconVariants = cva(
    "flex items-center justify-center opacity-20",
    {
        variants: {
            variant: {
                default: "text-blue-500",
                success: "text-emerald-500",
                warning: "text-amber-500",
                destructive: "text-rose-500",
                neutral: "text-gray-500",
                purple: "text-purple-500",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface StatsCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statsCardVariants> {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    description?: string
    valueClassName?: string
}

function StatsCard({
    className,
    variant,
    title,
    value,
    subtitle,
    icon: Icon,
    description,
    valueClassName,
    ...props
}: StatsCardProps) {
    return (
        <div className={cn(statsCardVariants({ variant }), className)} {...props}>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className={cn(
                        "text-sm font-medium",
                        variant === 'default' && "text-blue-600",
                        variant === 'success' && "text-emerald-600",
                        variant === 'warning' && "text-amber-600",
                        variant === 'destructive' && "text-rose-600",
                        variant === 'neutral' && "text-gray-600",
                        variant === 'purple' && "text-purple-600",
                    )}>
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={cn(
                            "text-3xl font-bold tracking-tight",
                            variant === 'default' && "text-blue-600",
                            variant === 'success' && "text-emerald-600",
                            variant === 'warning' && "text-amber-600",
                            variant === 'destructive' && "text-rose-600",
                            variant === 'neutral' && "text-gray-600",
                            variant === 'purple' && "text-purple-600",
                            valueClassName
                        )}>{value}</h3>
                    </div>
                    {subtitle && (
                        <p className={cn(
                            "text-xs font-medium mt-1",
                            variant === 'default' && "text-blue-400",
                            variant === 'success' && "text-emerald-400",
                            variant === 'warning' && "text-amber-400",
                            variant === 'destructive' && "text-rose-400",
                            variant === 'neutral' && "text-gray-400",
                            variant === 'purple' && "text-purple-400",
                        )}>{subtitle}</p>
                    )}
                    {description && (
                        <p className="text-xs text-muted-foreground mt-2">{description}</p>
                    )}
                </div>
                <div className={cn(iconVariants({ variant }))}>
                    <Icon className="h-[38px] w-[38px]" />
                </div>
            </div>
        </div>
    )
}

export { StatsCard }
