import jsPDF from 'jspdf';
import { Order } from '@shared/types/order';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const exportOrderToPDF = (order: Order): void => {
  const doc = new jsPDF();
  
  // Couleurs
  const primaryColor = [189, 15, 59]; // #bd0f3b
  const textColor = [0, 0, 0];
  const secondaryTextColor = [102, 102, 102];
  
  let yPosition = 20;
  
  // En-tête avec logo et titre
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Le Continental', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Application Cliente - Reçu de Commande', 105, 30, { align: 'center' });
  
  yPosition = 50;
  
  // Informations de la commande
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Détails de la Commande', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const orderDate = format(new Date(order.createdAt), 'dd/MM/yyyy à HH:mm:ss', { locale: fr });
  doc.text(`Date: ${orderDate}`, 20, yPosition);
  
  yPosition += 7;
  doc.text(`Numéro de commande: #${order.id}`, 20, yPosition);
  
  yPosition += 7;
  const statusLabel = order.status === 'completed' ? 'Terminée' : 
                      order.status === 'cancelled' ? 'Annulée' : 
                      order.status === 'pending' ? 'En attente' : 
                      order.status === 'preparing' ? 'En préparation' : 
                      order.status === 'ready' ? 'Prête' : order.status;
  doc.text(`Statut: ${statusLabel}`, 20, yPosition);
  
  yPosition += 7;
  doc.text(`Paiement: ${order.paymentStatus === 'paid' ? 'Payé' : 'En attente'}`, 20, yPosition);
  
  if (order.paymentMethod) {
    yPosition += 7;
    const paymentMethodLabel = order.paymentMethod === 'cash' ? 'Espèces' : 
                               order.paymentMethod === 'card' ? 'Carte bancaire' : 
                               'Paiement mobile';
    doc.text(`Méthode de paiement: ${paymentMethodLabel}`, 20, yPosition);
  }
  
  yPosition += 15;
  
  // Tableau des articles
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Articles commandés', 20, yPosition);
  
  yPosition += 8;
  
  // En-tête du tableau
  doc.setFillColor(245, 245, 245);
  doc.rect(20, yPosition - 5, 170, 8, 'F');
  
  doc.setFontSize(10);
  doc.text('Produit', 22, yPosition);
  doc.text('Qté', 120, yPosition);
  doc.text('Prix unit.', 140, yPosition);
  doc.text('Total', 170, yPosition, { align: 'right' });
  
  yPosition += 8;
  doc.setDrawColor(224, 224, 224);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 5;
  
  // Lignes des articles
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  
  order.items.forEach((item) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(item.productName, 22, yPosition);
    doc.text(item.quantity.toString(), 120, yPosition);
    doc.text(`${Number(item.unitPrice).toFixed(0)} FCFA`, 140, yPosition);
    doc.text(`${Number(item.totalPrice).toFixed(0)} FCFA`, 190, yPosition, { align: 'right' });
    
    yPosition += 7;
  });
  
  yPosition += 5;
  doc.setDrawColor(224, 224, 224);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 8;
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', 140, yPosition);
  doc.text(`${Number(order.totalAmount).toFixed(0)} FCFA`, 190, yPosition, { align: 'right' });
  
  yPosition += 15;
  
  // Preuve de paiement si payé
  if (order.paymentStatus === 'paid') {
    doc.setFillColor(232, 245, 233);
    doc.setDrawColor(46, 125, 50);
    doc.roundedRect(20, yPosition, 170, 20, 3, 3, 'FD');
    
    doc.setTextColor(46, 125, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ Preuve de Paiement', 25, yPosition + 7);
    
    doc.setFont('helvetica', 'normal');
    const paymentDate = order.completedAt 
      ? format(new Date(order.completedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })
      : format(new Date(order.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr });
    doc.text(`Cette commande a été payée le ${paymentDate}.`, 25, yPosition + 14);
    doc.text('Cette information sert de preuve de paiement.', 25, yPosition + 19);
  }
  
  // Pied de page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...secondaryTextColor);
    doc.text(
      `Page ${i} sur ${pageCount} - Le Continental - Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      105,
      285,
      { align: 'center' }
    );
  }
  
  // Télécharger le PDF
  const fileName = `commande-${order.id}-${format(new Date(order.createdAt), 'yyyy-MM-dd', { locale: fr })}.pdf`;
  doc.save(fileName);
};
