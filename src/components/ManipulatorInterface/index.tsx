import  { useEffect, useState } from 'react';
import { Box, Button, Paper, Snackbar, TextField, Typography, Slider } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAddHistoryMutation, useGetHistoryQuery } from '../../api/historyApi';

interface HistoryItem {
  id?: string;
  original: string;
  optimized: string;
  date: string;
  before: string;
  after: string;
}

const BASEURL = 'https://68412446d48516d1d35a5989.mockapi.io/api/v1/';

function optimizeCommands(input: string): string {
  if (input.length < 2) return input;
  let compressed = '', count = 1;
  for (let i = 1; i <= input.length; i++) {
    if (input[i] === input[i - 1]) count++;
    else {
      compressed += (count > 1 ? count : '') + input[i - 1];
      count = 1;
    }
  }
  let result = compressed;
  for (let size = 2; size <= result.length / 2; size++) {
    for (let start = 0; start <= result.length - size * 2; start++) {
      const chunk = result.slice(start, start + size);
      let repeatCount = 1;
      while (result.slice(start + repeatCount * size, start + (repeatCount + 1) * size) === chunk) {
        repeatCount++;
      }
      if (repeatCount >= 2) {
        const fullBlock = chunk.repeat(repeatCount);
        const compressedBlock = `${repeatCount}(${chunk})`;
        result = result.replace(fullBlock, compressedBlock);
        break;
      }
    }
  }
  return result;
}

interface ManipulatorInterfaceProps {
  onLogout: () => void;
}

export default function ManipulatorInterface({ onLogout }: ManipulatorInterfaceProps) {
  const { register, handleSubmit, reset } = useForm();
  const [gridSize, setGridSize] = useState<number>(() => {
    const saved = localStorage.getItem('gridSize');
    return saved ? parseInt(saved, 10) : 7;
  });
  const [position, setPosition] = useState<[number, number]>([Math.floor(gridSize / 2), Math.floor(gridSize / 2)]);
  const [optimized, setOptimized] = useState('');
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [addHistory] = useAddHistoryMutation();
  const { data: history = [], refetch } = useGetHistoryQuery();

  useEffect(() => {
    localStorage.setItem('gridSize', String(gridSize));
  }, [gridSize]);

  useEffect(() => {
    if (history.length) {
      const latest = [...history].filter(h => h.after?.startsWith('('))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latest?.after) {
        const match = latest.after.match(/\((\d+),\s*(\d+)\)/);
        if (match) {
          setPosition([parseInt(match[1]), parseInt(match[2])]);
        }
      }
    }
  }, [history]);

  const onSubmit = async (data: any) => {
    const raw = data.commands?.trim().toUpperCase();
    if (!raw) return;

    const opt = optimizeCommands(raw);
    const before = `(${position[0]}, ${position[1]})`;
    const entry: HistoryItem = {
      original: raw,
      optimized: opt,
      date: new Date().toLocaleString(),
      before,
      after: ''
    };

    const created = await addHistory(entry).unwrap();
    await animateMovement(raw, created);
    setOptimized(opt);
    setOpen(true);
    reset({ commands: '' });
  };

  const animateMovement = async (cmd: string, entry: HistoryItem) => {
    setAnimating(true);
    let [x, y] = [...position];
    for (let c of cmd) {
      await new Promise(res => setTimeout(res, 300));
      let nextX = x;
      let nextY = y;

      switch (c) {
        case 'Л': nextX--; break;
        case 'П': nextX++; break;
        case 'В': nextY--; break;
        case 'Н': nextY++; break;
        default: break;
      }

      if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) {
        setAlert(`Cannot move ${c}: Wall reached.`);
        continue;
      }

      x = nextX;
      y = nextY;
      setPosition([x, y]);
    }

    await fetch(`${BASEURL}history/${entry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, after: `(${x}, ${y})` })
    });

    setAnimating(false);
    refetch();
  };

  const handleClearHistory = async () => {
    if (!history.length) return;
    await Promise.all(history.map(item =>
      fetch(`${BASEURL}history/${item.id}`, {
        method: 'DELETE'
      })
    ));
    refetch();
  };

  return (
    <Paper elevation={3} sx={{ padding: 4, borderRadius: 3 }}>
      <Box display="flex" justifyContent={'space-between'} gap={2} mb={2}>
        <Typography variant="h5" gutterBottom>Manipulator Control</Typography>
        <Button onClick={() => { localStorage.setItem('isLoggedIn', 'false'); onLogout(); }} color="secondary" variant="outlined">Logout</Button>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Enter Commands (Л, П, В, Н, О, Б)"
          fullWidth
          {...register('commands')}
          margin="normal"
          disabled={animating}
        />
        <Button variant="contained" type="submit" fullWidth sx={{ mt: 2 }} disabled={animating}>
          {animating ? 'Animating...' : 'Optimize & Execute'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', mb: 3 }}>
        <Slider
          value={gridSize}
          onChange={(_, val) => {
            if (typeof val === 'number') {
              const [x, y] = position;
              if (x < val && y < val) {
                setGridSize(val);
              } else {
                setAlert("Current position exceeds new grid size. Please move robot first.");
              }
            }
          }}

          step={1}
          marks
          min={3}
          max={15}
          valueLabelDisplay="auto"
          sx={{ width: 200 }}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 36px)`,
            gridTemplateRows: `repeat(${gridSize}, 36px)`,
            gap: '3px',
            mt: 2
          }}>
          {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
            const row = Math.floor(idx / gridSize);
            const col = idx % gridSize;
            const isActive = position[0] === col && position[1] === row;
            return (
              <Box key={idx} sx={{
                width: 36, height: 36,
                border: '1px solid gray',
                bgcolor: isActive ? 'primary.main' : 'grey.100',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, borderRadius: 1, color: isActive ? 'white' : 'black'
              }}>
                {isActive ? '🤖' : ''}
              </Box>
            );
          })}
        </Box>
      </Box>

      {optimized && (
        <Typography sx={{ mt: 2 }}><strong>Optimized:</strong> {optimized}</Typography>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }}>
        <Typography variant="h6">History</Typography>
        <Button variant="outlined" color="error" onClick={handleClearHistory} disabled={!history.length}>Clear</Button>
      </Box>

      <Box component="ul" sx={{ pl: 3 }}>
        {history.map(item => (
          <li key={item.id}><strong>{item.date}</strong>: {item.original} → {item.optimized}<br />Before: {item.before} | After: {item.after}</li>
        ))}
      </Box>

      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        message="Command executed successfully"
        ContentProps={{ sx: { backgroundColor: 'success.main' } }}
      />
      <Snackbar
        open={!!alert}
        autoHideDuration={3000}
        onClose={() => setAlert(null)}
        message={alert}
        ContentProps={{ sx: { backgroundColor: 'error.main' } }}
      />
    </Paper>
  );
}
