import { useCallback } from 'react';
import { trpc } from '@/providers/trpc';
import type { TodoItem } from '../types/todo';

export function useTodos() {
  const utils = trpc.useUtils();
  const { data: todos = [], isLoading } = trpc.todo.list.useQuery();

  const createMutation = trpc.todo.create.useMutation({
    onSuccess: () => utils.todo.list.invalidate(),
  });

  const deleteMutation = trpc.todo.delete.useMutation({
    onSuccess: () => utils.todo.list.invalidate(),
  });

  const completeMutation = trpc.todo.complete.useMutation({
    onSuccess: () => utils.todo.list.invalidate(),
  });

  const uncompleteMutation = trpc.todo.uncomplete.useMutation({
    onSuccess: () => utils.todo.list.invalidate(),
  });

  const addTodo = useCallback((title: string, durationMs: number) => {
    createMutation.mutate({ title, durationMs });
  }, [createMutation]);

  const removeTodo = useCallback((id: number) => {
    deleteMutation.mutate({ id });
  }, [deleteMutation]);

  const completeTodo = useCallback((id: number) => {
    completeMutation.mutate({ id });
  }, [completeMutation]);

  const uncompleteTodo = useCallback((id: number) => {
    uncompleteMutation.mutate({ id });
  }, [uncompleteMutation]);

  return {
    todos: todos as TodoItem[],
    isLoading,
    addTodo,
    removeTodo,
    completeTodo,
    uncompleteTodo,
  };
}
