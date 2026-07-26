package com.i2i.voltwise.invoice;

public final class InvoiceDtos {
  private InvoiceDtos() {}

  /**
   * Result of reading a "Fatura Detayı" table from an uploaded electricity bill image.
   *
   * @param recognized  true if the energy unit price row was confidently located
   * @param unitPrice   the "Birim Fiyat" (₺/kWh) value of the energy consumption row, or null if not found
   * @param singleTier  true when no Gündüz/Puant/Gece (day/peak/night) breakdown was detected -> "tek kademeli"
   * @param tariffLabel human-readable Turkish label describing the detected tariff structure
   * @param message     short status message safe to show to the end user
   */
  public record InvoiceParseResult(
      boolean recognized,
      Double unitPrice,
      boolean singleTier,
      String tariffLabel,
      String message
  ) {}
}
