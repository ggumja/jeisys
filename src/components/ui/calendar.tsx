import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames, type DayButton, type Locale } from "react-day-picker"
import { cn } from "../../lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: "default" | "ghost"
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          "absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          "inline-flex items-center justify-center whitespace-nowrap rounded text-sm font-medium transition-colors",
          "hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-50"
        ),
        button_next: cn(
          "absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          "inline-flex items-center justify-center whitespace-nowrap rounded text-sm font-medium transition-colors",
          "hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-50"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-neutral-500 rounded w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([data-selected=true])]:bg-neutral-100 first:[&:has([data-selected=true])]:rounded-s-md last:[&:has([data-selected=true])]:rounded-e-md",
          "[&:last-child[data-selected=true]_button]:rounded-e-md",
          "[&:nth-child(2)[data-selected=true]_button]:rounded-s-md",
          "[&:first-child[data-selected=true]_button]:rounded-s-md"
        ),
        day_button: cn(
          "relative size-9 p-0 font-normal",
          "inline-flex items-center justify-center whitespace-nowrap rounded text-sm transition-colors",
          "hover:bg-neutral-100 hover:text-neutral-900",
          "disabled:pointer-events-none disabled:opacity-50",
          "data-[selected=true]:bg-neutral-900 data-[selected=true]:text-white data-[selected=true]:hover:bg-neutral-900 data-[selected=true]:hover:text-white",
          "data-[today=true]:bg-neutral-100 data-[today=true]:text-neutral-900",
          "data-[outside=true]:text-neutral-500 data-[outside=true]:opacity-50",
          "data-[range-end=true]:rounded-e-md",
          "data-[range-start=true]:rounded-s-md"
        ),
        range_start: cn(
          "rounded-s-md",
          "after:absolute after:inset-y-0 after:end-0 after:w-1/2 after:bg-neutral-100 after:z-[-1]"
        ),
        range_end: cn(
          "rounded-e-md",
          "before:absolute before:inset-y-0 before:start-0 before:w-1/2 before:bg-neutral-100 before:z-[-1]"
        ),
        range_middle: "bg-neutral-100 rounded-none",
        disabled: "text-neutral-500 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        ...components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected={modifiers.selected}
      data-today={modifiers.today}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      {...props}
    />
  )
}

export { Calendar }
