import { FC, useCallback, useState } from 'react';
import dayjs from 'dayjs';
import { Calendar, TimeInput } from '@mantine/dates';
import { useClickOutside } from '@mantine/hooks';
import { Button } from '@gitroom/react/form/button';
import { isUSCitizen } from './isuscitizen.utils';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { CalendarIcon } from '@gitroom/frontend/components/ui/icons';
import clsx from 'clsx';
export const DatePicker: FC<{
  date: dayjs.Dayjs;
  onChange: (day: dayjs.Dayjs) => void;
}> = (props) => {
  const { date, onChange } = props;
  const [open, setOpen] = useState(false);
  const t = useT();

  const changeShow = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);
  const ref = useClickOutside<HTMLDivElement>(() => {
    setOpen(false);
  });
  const changeDate = useCallback(
    (type: 'date' | 'time') => (day: Date) => {
      onChange(
        newDayjs(
          type === 'time'
            ? date.format('YYYY-MM-DD') + ' ' + newDayjs(day).format('HH:mm:ss')
            : newDayjs(day).format('YYYY-MM-DD') + ' ' + date.format('HH:mm:ss')
        )
      );
    },
    [date]
  );
  return (
    <div
      className="acadepost-date-picker-trigger px-[16px] justify-center flex gap-[8px] items-center relative h-[44px] text-[15px] font-[600] ml-[7px] select-none flex-1"
      onClick={changeShow}
      ref={ref}
    >
      <div className="cursor-pointer">
        <CalendarIcon />
      </div>
      <div className="cursor-pointer">
        {date.format(isUSCitizen() ? 'MM/DD/YYYY hh:mm A' : 'DD/MM/YYYY HH:mm')}
      </div>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="acadepost-date-popover animate-fadeIn absolute bottom-[100%] mb-[16px] start-[50%] -translate-x-[50%] z-[300] flex flex-col"
        >
          <Calendar
            onChange={changeDate('date')}
            value={date.toDate()}
            dayClassName={(date, modifiers) => {
              const isToday = newDayjs(date).isSame(newDayjs(), 'day');
              return clsx(
                'acadepost-calendar-day',
                modifiers.outside && 'acadepost-calendar-day-outside',
                modifiers.disabled && 'acadepost-calendar-day-disabled',
                modifiers.selected && 'acadepost-calendar-day-selected',
                isToday && 'acadepost-calendar-day-today'
              );
            }}
            classNames={{
              calendarHeader: 'acadepost-calendar-header',
              calendarHeaderControl: 'acadepost-calendar-header-control',
              calendarHeaderLevel: 'acadepost-calendar-header-level',
              month: 'acadepost-calendar-month',
              weekday: 'acadepost-calendar-weekday',
              day: 'acadepost-calendar-day-base',
            }}
          />
          <TimeInput
            onChange={changeDate('time')}
            label={t('pick_time', 'Heure')}
            classNames={{
              label: 'acadepost-time-label',
              input: 'acadepost-time-input',
            }}
            defaultValue={date.toDate()}
          />
          <Button className="acadepost-date-close mt-[12px]" onClick={changeShow}>
            {t('close', 'Fermer')}
          </Button>
        </div>
      )}
    </div>
  );
};
