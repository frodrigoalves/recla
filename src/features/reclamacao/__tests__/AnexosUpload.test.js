import { render, screen, fireEvent } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import AnexosUpload from '../../../components/AnexosUpload';

describe('AnexosUpload', () => {
  const mockOnChange = jest.fn();
  const mockData = { anexos: [] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o componente corretamente', () => {
    render(<AnexosUpload data={mockData} onChange={mockOnChange} />);

    expect(screen.getByText('Anexos')).toBeInTheDocument();
    expect(screen.getByText(/Tipos permitidos/)).toBeInTheDocument();
    expect(screen.getByText(/Tamanho máximo/)).toBeInTheDocument();
  });

  it('deve validar o tamanho máximo do arquivo', () => {
    render(<AnexosUpload data={mockData} onChange={mockOnChange} />);

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 16 * 1024 * 1024 }); // 16MB

    const input = screen.getByRole('file');
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnChange).not.toHaveBeenCalled();
    expect(screen.getByText(/arquivo muito grande/i)).toBeInTheDocument();
  });

  it('deve validar tipos de arquivo permitidos', () => {
    render(<AnexosUpload data={mockData} onChange={mockOnChange} />);

    const file = new File([''], 'test.exe', { type: 'application/x-msdownload' });
    
    const input = screen.getByRole('file');
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnChange).not.toHaveBeenCalled();
    expect(screen.getByText(/tipo de arquivo não permitido/i)).toBeInTheDocument();
  });

  it('deve aceitar múltiplos arquivos válidos', () => {
    render(<AnexosUpload data={mockData} onChange={mockOnChange} />);

    const files = [
      new File([''], 'photo.jpg', { type: 'image/jpeg' }),
      new File([''], 'doc.pdf', { type: 'application/pdf' }),
      new File([''], 'video.mp4', { type: 'video/mp4' })
    ];

    const input = screen.getByRole('file');
    fireEvent.change(input, { target: { files } });

    expect(mockOnChange).toHaveBeenCalledWith('anexos', files);
  });

  it('deve permitir remover arquivos', () => {
    const dataComAnexos = {
      anexos: [
        new File([''], 'test.jpg', { type: 'image/jpeg' })
      ]
    };

    render(<AnexosUpload data={dataComAnexos} onChange={mockOnChange} />);

    const removeButton = screen.getByText('Remover');
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith('anexos', []);
  });

  it('deve mostrar lista de arquivos selecionados', () => {
    const files = [
      new File([''], 'photo.jpg', { type: 'image/jpeg' }),
      new File([''], 'doc.pdf', { type: 'application/pdf' })
    ];

    const dataComAnexos = { anexos: files };

    render(<AnexosUpload data={dataComAnexos} onChange={mockOnChange} />);

    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
  });
});