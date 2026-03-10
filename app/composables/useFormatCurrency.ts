export const useFormatCurrency = () => {
  function formatCurrency(value: number | string | null | undefined): string {
    const num = Number(value ?? 0)
    return new Intl.NumberFormat('id-ID').format(isNaN(num) ? 0 : num)
  }

  return { formatCurrency }
}
