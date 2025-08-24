import { memo } from 'react';
import { Chip, useTheme, alpha } from '@mui/material';

interface FilterChipProps {
  label: string;
  onDelete?: () => void;
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium';
}

const FilterChip = memo(({
  label,
  onDelete,
  color = 'primary',
  size = 'small',
}: FilterChipProps) => {
  const theme = useTheme();

  return (
    <Chip
      label={label}
      onDelete={onDelete}
      size={size}
      sx={{
        bgcolor: alpha(theme.palette[color].main, 0.1),
        color: theme.palette[color].dark,
        '& .MuiChip-deleteIcon': {
          color: theme.palette[color].main,
          '&:hover': {
            color: theme.palette[color].dark,
          }
        }
      }}
    />
  );
});

FilterChip.displayName = 'FilterChip';

export default FilterChip;