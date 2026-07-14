import Swal from 'sweetalert2';

export const showSuccess = (message: string) => {
  return Swal.fire({
    icon: 'success',
    title: 'Berhasil',
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
};

export const showError = (message: string) => {
  return Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: message,
  });
};

export const showConfirm = (title: string, text: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal'
  });
};

export const showAlert = (message: string) => {
  return Swal.fire({
    text: message,
  });
};

export default Swal;
