import { renderHook, act } from '@testing-library/react';
import { useToast } from '../use-toast';

describe('useToast Hook', () => {
  it('should initialize with empty toasts', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toasts).toEqual([]);
  });

  it('should add toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'Test description'
      });
    });
    
    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
  });

  it('should dismiss toast', () => {
    const { result } = renderHook(() => useToast());
    
    let toastId: string;
    
    act(() => {
      const { id } = result.current.toast({
        title: 'Test Toast'
      });
      toastId = id;
    });
    
    expect(result.current.toasts.length).toBe(1);
    
    act(() => {
      result.current.dismiss(toastId!);
    });
    
    // Toast should be dismissed
    expect(result.current.toasts.length).toBe(0);
  });
});

