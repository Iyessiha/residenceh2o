/**
 * Template PDF facture — Résidences H2O
 * Utilisé UNIQUEMENT côté serveur (API route) — ne jamais importer dans un Client Component.
 */
import {
  Document, Page, View, Text, StyleSheet, Svg, Rect, Image,
} from '@react-pdf/renderer'
import qrcode from 'qrcode-generator'

// Helvetica est une police PDF standard — aucune registration nécessaire.

function QRCodePDF({ value, size = 72 }) {
  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()
  const count = qr.getModuleCount()
  const cell = size / count
  const rects = []
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        rects.push(
          <Rect key={`${row}-${col}`} x={col * cell} y={row * cell} width={cell} height={cell} fill="#1A0A04" />
        )
      }
    }
  }
  return <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{rects}</Svg>
}

const C = {
  primary:  '#E8513A',
  dark:     '#1A0A04',
  text:     '#222222',
  text2:    '#484848',
  text3:    '#767676',
  border:   '#DDDDDD',
  bg2:      '#F7F7F7',
  success:  '#008A05',
  white:    '#FFFFFF',
}

const s = StyleSheet.create({
  page:      { fontFamily: 'Helvetica', fontSize: 10, color: C.text, padding: 40, backgroundColor: C.white },
  // En-tête
  header:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  logo:      { fontSize: 18, fontWeight: 700, color: C.dark },
  logoSub:   { fontSize: 9, color: C.text3, marginTop: 2 },
  gradient:  { width: 80, height: 4, backgroundColor: C.primary, borderRadius: 2, marginTop: 4 },
  badge:     { backgroundColor: C.primary, color: C.white, fontSize: 11, fontWeight: 700,
               paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4 },
  // Section info
  infoRow:   { flexDirection: 'row', gap: 24, marginBottom: 20 },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 7, fontWeight: 700, color: C.text3, textTransform: 'uppercase',
               letterSpacing: 1, marginBottom: 4 },
  infoVal:   { fontSize: 10, color: C.text },
  infoValBold: { fontSize: 10, fontWeight: 700, color: C.text },
  // Ligne de séparation
  divider:   { borderBottomWidth: 1, borderBottomColor: C.border, marginVertical: 16 },
  // Table
  tableHead: { flexDirection: 'row', backgroundColor: C.bg2, paddingVertical: 6,
               paddingHorizontal: 10, borderRadius: 4, marginBottom: 2 },
  tableTh:   { fontSize: 8, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow:  { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10,
               borderBottomWidth: 1, borderBottomColor: C.border },
  tableTd:   { fontSize: 10, color: C.text },
  col1:      { flex: 3 },
  col2:      { flex: 1, textAlign: 'center' },
  col3:      { flex: 1, textAlign: 'right' },
  // Totaux
  totaux:    { marginTop: 12, alignItems: 'flex-end' },
  totRow:    { flexDirection: 'row', justifyContent: 'space-between', width: 220,
               paddingVertical: 3 },
  totLabel:  { fontSize: 10, color: C.text2 },
  totVal:    { fontSize: 10, color: C.text },
  totSolde:  { flexDirection: 'row', justifyContent: 'space-between', width: 220,
               paddingVertical: 5, borderTopWidth: 2, borderTopColor: C.primary, marginTop: 4 },
  totBold:   { fontSize: 11, fontWeight: 700, color: C.text },
  totBoldVal:{ fontSize: 11, fontWeight: 700, color: C.primary },
  soldePaye: { fontSize: 11, fontWeight: 700, color: C.success },
  // Statut badge
  statutBox: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
               alignSelf: 'flex-end', marginTop: 2 },
  // QR code
  qrSection: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20,
                backgroundColor: C.bg2, borderRadius: 6, padding: 12 },
  qrText:    { flex: 1 },
  qrTitle:   { fontSize: 9, fontWeight: 700, color: C.text, marginBottom: 3 },
  qrSub:     { fontSize: 8, color: C.text3, lineHeight: 1.5 },
  // Pied de page
  footer:    { position: 'absolute', bottom: 30, left: 40, right: 40 },
  footerLine:{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  footerTxt: { fontSize: 8, color: C.text3, textAlign: 'center', lineHeight: 1.5 },
})

// Caractères sûrs pour les polices PDF standard : pas d'espace fine insécable
// (affichée en barre oblique), ni de signe typographique hors WinAnsi.
function fcfa(n) {
  if (!n && n !== 0) return '—'
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
function fdate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return `${String(date.getDate()).padStart(2, '0')} ${MOIS[date.getMonth()]} ${date.getFullYear()}`
}

const TYPES_LABELS = {
  sejour: 'Séjour', chambre: 'Chambre', evenement: 'Événement',
  restauration: 'Restauration', autre: 'Autre',
}

const STATUT_LABELS = {
  brouillon: 'Brouillon', envoye: 'Envoyé', paye: 'Payé',
  partiel: 'Paiement partiel', impaye: 'Impayé',
}
const STATUT_COLORS = {
  brouillon: { border: '#CCCCCC', text: '#767676' },
  envoye:    { border: '#3B82F6', text: '#3B82F6' },
  paye:      { border: '#008A05', text: '#008A05' },
  partiel:   { border: '#D4A843', text: '#D4A843' },
  impaye:    { border: '#E8513A', text: '#E8513A' },
}

export function FacturePDF({ facture, guestUrl, logo, entreprise }) {
  const sc = STATUT_COLORS[facture.statut] || STATUT_COLORS.brouillon
  const solde = (facture.montant_total || 0) - (facture.montant_paye || 0)

  return (
    <Document
      title={`Facture ${facture.numero} — Les Résidences H2O`}
      author="Les Résidences H2O"
      subject="Facture de prestation"
      creator="H2O Manager — MonWe Infinity LLC"
    >
      <Page size="A4" style={s.page}>

        {/* ── En-tête ─────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            {logo && <Image src={{ data: logo, format: 'png' }} style={{ width: 210, height: 61, marginBottom: 8 }} />}
            <Text style={s.logoSub}>Villa Poton, ancienne route de Bassam, au lac · Côte d'Ivoire</Text>
            <Text style={s.logoSub}>contact@residencesh2o.com · +225 07 49 19 49 52 · WhatsApp 07 05 25 92 34</Text>
            <View style={s.gradient} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.badge}>FACTURE</Text>
            {facture.numero ? (
              <Text style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 8 }}>
                N° {facture.numero}
              </Text>
            ) : null}
            <View style={[s.statutBox, { borderColor: sc.border }]}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: sc.text }}>
                {STATUT_LABELS[facture.statut] || facture.statut}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Infos facture + client ────────────────────────── */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Facturé à</Text>
            <Text style={s.infoValBold}>{facture.nom_client}</Text>
            {facture.telephone ? <Text style={s.infoVal}>{facture.telephone}</Text> : null}
            {facture.email_client ? <Text style={s.infoVal}>{facture.email_client}</Text> : null}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Détails</Text>
            <Text style={s.infoVal}>Date d'émission : {fdate(facture.created_at)}</Text>
            {facture.date_echeance
              ? <Text style={s.infoVal}>Échéance : {fdate(facture.date_echeance)}</Text>
              : null}
            {facture.numero ? <Text style={s.infoVal}>Référence : {facture.numero}</Text> : null}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Émis par</Text>
            <Text style={s.infoValBold}>Les Résidences H2O</Text>
            <Text style={s.infoVal}>Villa Poton, ancienne route de Bassam</Text>
            <Text style={s.infoVal}>Côte d'Ivoire</Text>
            {entreprise?.rccm ? <Text style={s.infoVal}>RCCM : {entreprise.rccm}</Text> : null}
            {entreprise?.ifu ? <Text style={s.infoVal}>N° IFU : {entreprise.ifu}</Text> : null}
            {entreprise?.tva ? <Text style={s.infoVal}>N° TVA : {entreprise.tva}</Text> : null}
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Tableau prestations ───────────────────────────── */}
        <View style={s.tableHead}>
          <Text style={[s.tableTh, s.col1]}>Description</Text>
          <Text style={[s.tableTh, s.col2]}>Type</Text>
          <Text style={[s.tableTh, s.col3]}>Montant</Text>
        </View>

        <View style={s.tableRow}>
          <Text style={[s.tableTd, s.col1]}>
            {facture.description || `Prestation — ${facture.type_prestation}`}
          </Text>
          <Text style={[s.tableTd, s.col2]}>{TYPES_LABELS[facture.type_prestation] || facture.type_prestation}</Text>
          <Text style={[s.tableTd, s.col3]}>{fcfa(facture.montant_total)}</Text>
        </View>

        {/* ── Totaux ───────────────────────────────────────── */}
        <View style={s.totaux}>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Sous-total</Text>
            <Text style={s.totVal}>{fcfa(facture.montant_total)}</Text>
          </View>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Acompte / déjà payé</Text>
            <Text style={[s.totVal, { color: C.success }]}>- {fcfa(facture.montant_paye)}</Text>
          </View>
          <View style={s.totSolde}>
            <Text style={s.totBold}>
              {solde <= 0 ? 'Solde (payé intégralement)' : 'Solde restant dû'}
            </Text>
            <Text style={solde <= 0 ? s.soldePaye : s.totBoldVal}>
              {fcfa(Math.max(solde, 0))}
            </Text>
          </View>
        </View>

        {/* ── QR code réservation ──────────────────────────── */}
        {guestUrl ? (
          <View style={s.qrSection}>
            <QRCodePDF value={guestUrl} size={72} />
            <View style={s.qrText}>
              <Text style={s.qrTitle}>Accès direct à votre séjour</Text>
              <Text style={s.qrSub}>Scannez ce QR code pour suivre votre réservation,</Text>
              <Text style={s.qrSub}>commander depuis votre chambre et installer l'application.</Text>
            </View>
          </View>
        ) : null}

        {/* ── Pied de page ─────────────────────────────────── */}
        <View style={s.footer}>
          <View style={s.footerLine}>
            <Text style={s.footerTxt}>
              Les Résidences H2O — Villa Poton, ancienne route de Bassam, au lac, Côte d'Ivoire
            </Text>
            <Text style={s.footerTxt}>
              Merci de votre confiance.
            </Text>
            <Text style={s.footerTxt}>
              Toute reproduction ou modification non autorisée est interdite.
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
