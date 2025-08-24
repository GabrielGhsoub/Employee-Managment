import { memo } from 'react';
import {
  Stack,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';

interface ViewToggleProps {
  value: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
  size?: number;
}

const ViewToggle = memo(({
  value,
  onChange,
  size = 40,
}: ViewToggleProps) => {
  const theme = useTheme();

  return (
    <Stack 
      direction="row" 
      sx={{ 
        border: `1px solid ${theme.palette.divider}`, 
        borderRadius: 1,
        overflow: 'hidden',
        height: size,
      }}
    >
      <IconButton
        onClick={() => onChange('grid')}
        sx={{
          borderRadius: 0,
          minWidth: size,
          height: size,
          bgcolor: value === 'grid' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          color: value === 'grid' ? theme.palette.primary.main : theme.palette.text.secondary,
          borderRight: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
          }
        }}
      >
        <GridViewIcon />
      </IconButton>
      <IconButton
        onClick={() => onChange('list')}
        sx={{
          borderRadius: 0,
          minWidth: size,
          height: size,
          bgcolor: value === 'list' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          color: value === 'list' ? theme.palette.primary.main : theme.palette.text.secondary,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
          }
        }}
      >
        <ListViewIcon />
      </IconButton>
    </Stack>
  );
});

ViewToggle.displayName = 'ViewToggle';

export default ViewToggle;