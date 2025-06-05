import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface HistoryItem {
  id?: string;
  original: string;
  optimized: string;
  date: string;
  before: string;
  after: string;
}

export const historyApi = createApi({
  reducerPath: 'historyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://68412446d48516d1d35a5989.mockapi.io/api/v1/',
  }),
  tagTypes: ['History'],
  endpoints: (builder) => ({
    getHistory: builder.query<HistoryItem[], void>({
      query: () => 'history',
      providesTags: ['History'],
    }),
    addHistory: builder.mutation<HistoryItem, Partial<HistoryItem>>({
      query: (newItem) => ({
        url: 'history',
        method: 'POST',
        body: newItem,
      }),
      invalidatesTags: ['History'],
    }),
  }),
});

export const { useGetHistoryQuery, useAddHistoryMutation } = historyApi;
