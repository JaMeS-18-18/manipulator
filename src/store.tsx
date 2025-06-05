// 📁 src/store.tsx
import { configureStore } from '@reduxjs/toolkit';
import { historyApi } from './api/historyApi';

export const store = configureStore({
  reducer: {
    [historyApi.reducerPath]: historyApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(historyApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
