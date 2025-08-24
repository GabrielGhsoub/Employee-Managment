import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Employee } from '../types';

export const useEmployeeActions = () => {
  const queryClient = useQueryClient();
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const handleEdit = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedEmployee(null);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteConfirmOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedEmployee(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    handleFormClose();
  }, [queryClient, handleFormClose]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmOpen(false);
    setEmployeeToDelete(null);
  }, []);

  return {
    // Form state
    formOpen,
    selectedEmployee,
    
    // Delete state
    deleteConfirmOpen,
    employeeToDelete,
    
    // Actions
    handleEdit,
    handleAdd,
    handleDelete,
    handleFormClose,
    handleFormSuccess,
    handleDeleteCancel,
  };
};