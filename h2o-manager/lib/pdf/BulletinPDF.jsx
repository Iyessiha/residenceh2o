/**
 * Template PDF bulletin de paie — Résidences H2O
 * Utilisé UNIQUEMENT côté serveur (API route) — ne jamais importer dans un Client Component.
 */
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer'

const C = {
  primary: '#E8513A', dark: '#1A0A04', text: '#222222', text2: '#484848', text3: '#767676',
  border: '#DDDDDD', bg2: '#F7F7F7', success: '#008A05', white: '#FFFFFF',
}

const s = StyleSheet.create({
  page:     { fontFamily: 'Helvetica', fontSize: 10, color: C.text, padding: 40, backgroundColor: C.white },
  header:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  sub:      { fontSize: 9, color: C.text3, marginTop: 2 },
  bar:      { width: 80, height: 4, backgroundColor: C.primary, borderRadius: 2, marginTop: 4 },
  badge:    { backgroundColor: C.primary, color: C.white, fontSize: 11, fontWeight: 700, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4 },
  divider:  { borderBottomWidth: 1, borderBottomColor: C.border, marginVertical: 14 },
  infoRow:  { flexDirection: 'row', gap: 24, marginBottom: 16 },
  infoBlock:{ flex: 1 },
  label:    { fontSize: 7, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  val:      { fontSize: 10, color: C.text },
  valBold:  { fontSize: 10, fontWeight: 700, color: C.text },
  head:     { flexDirection: 'row', backgroundColor: C.bg2, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginBottom: 2 },
  th:       { fontSize: 8, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8 },
  row:      { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  td:       { fontSize: 10, color: C.text },
  cDes:     { flex: 3 },
  cTaux:    { flex: 1, textAlign: 'center' },
  cGain:    { flex: 1.4, textAlign: 'right' },
  cRet:     { flex: 1.4, textAlign: 'right' },
  totBox:   { marginTop: 12, alignItems: 'flex-end' },
  totRow:   { flexDirection: 'row', justifyContent: 'space-between', width: 250, paddingVertical: 3 },
  net:      { flexDirection: 'row', justifyContent: 'space-between', width: 250, paddingVertical: 6, borderTopWidth: 2, borderTopColor: C.primary, marginTop: 4 },
  netTxt:   { fontSize: 12, fontWeight: 700, color: C.text },
  netVal:   { fontSize: 12, fontWeight: 700, color: C.primary },
  sigRow:   { flexDirection: 'row', gap: 24, marginTop: 28 },
  sig:      { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, height: 70, padding: 8 },
  footer:   { position: 'absolute', bottom: 30, left: 40, right: 40 },
  footLine: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  footTxt:  { fontSize: 8, color: C.text3, textAlign: 'center', lineHeight: 1.5 },
})

// Polices PDF standard : pas d'espace fine insécable
function fcfa(n) {
  if (!n && n !== 0) return '—'
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
// Dates 'AAAA-MM-JJ' lues telles quelles (sans décalage de fuseau)
function fdate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '')
  return m ? `${m[3]} ${MOIS[Number(m[2]) - 1]} ${m[1]}` : '—'
}
function fmois(d) {
  const m = /^(\d{4})-(\d{2})/.exec(d || '')
  return m ? `${MOIS[Number(m[2]) - 1]} ${m[1]}` : '—'
}
const taux = (t) => (Number(t) > 0 ? `${String(Number(t)).replace('.', ',')} %` : '')
const MODES = { especes: 'Espèces', mobile_money: 'Mobile Money', virement: 'Virement', cheque: 'Chèque' }
const CONTRATS = { cdi: 'CDI', cdd: 'CDD', journalier: 'Journalier', stage: 'Stage', prestataire: 'Prestataire' }

export function BulletinPDF({ fiche, employe, entreprise, logo }) {
  const gains = fiche.gains || []
  const retenues = fiche.retenues || []
  const charges = fiche.total_charges || 0
  const periode = fmois(fiche.mois)

  return (
    <Document
      title={`Bulletin de paie ${fiche.numero} — ${fiche.employe_nom}`}
      author="Les Résidences H2O"
      subject={`Bulletin de paie ${periode}`}
      creator="H2O Manager — MonWe Infinity LLC"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            {logo && <Image src={{ data: logo, format: 'png' }} style={{ width: 210, height: 61, marginBottom: 8 }} />}
            <Text style={s.sub}>Villa Poton, ancienne route de Bassam, au lac · Côte d'Ivoire</Text>
            <Text style={s.sub}>contact@residencesh2o.com · +225 07 49 19 49 52</Text>
            <View style={s.bar} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.badge}>BULLETIN DE PAIE</Text>
            <Text style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>{periode}</Text>
            <Text style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>N° {fiche.numero}</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.label}>Salarié</Text>
            <Text style={s.valBold}>{fiche.employe_nom}</Text>
            {fiche.employe_poste ? <Text style={s.val}>{fiche.employe_poste}</Text> : null}
            {employe?.type_contrat ? <Text style={s.val}>Contrat : {CONTRATS[employe.type_contrat] || employe.type_contrat}</Text> : null}
            {employe?.date_embauche ? <Text style={s.val}>Embauché le {fdate(employe.date_embauche)}</Text> : null}
            {fiche.employe_cnps ? <Text style={s.val}>N° CNPS : {fiche.employe_cnps}</Text> : null}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.label}>Période</Text>
            <Text style={s.val}>{periode}</Text>
            <Text style={s.val}>{fiche.statut === 'paye' ? `Payé le ${fdate(fiche.date_paiement)}` : 'Paiement à effectuer'}</Text>
            {fiche.statut === 'paye' && fiche.mode_paiement
              ? <Text style={s.val}>Mode : {MODES[fiche.mode_paiement] || fiche.mode_paiement}</Text> : null}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.label}>Employeur</Text>
            <Text style={s.valBold}>Les Résidences H2O</Text>
            <Text style={s.val}>Villa Poton, ancienne route de Bassam</Text>
            {entreprise?.rccm ? <Text style={s.val}>RCCM : {entreprise.rccm}</Text> : null}
            {entreprise?.ifu ? <Text style={s.val}>N° IFU : {entreprise.ifu}</Text> : null}
          </View>
        </View>

        <View style={s.head}>
          <Text style={[s.th, s.cDes]}>Désignation</Text>
          <Text style={[s.th, s.cTaux]}>Taux</Text>
          <Text style={[s.th, s.cGain]}>Gains</Text>
          <Text style={[s.th, s.cRet]}>Retenues</Text>
        </View>
        <View style={s.row}>
          <Text style={[s.td, s.cDes]}>Salaire de base</Text>
          <Text style={[s.td, s.cTaux]}></Text>
          <Text style={[s.td, s.cGain]}>{fcfa(fiche.salaire_base)}</Text>
          <Text style={[s.td, s.cRet]}></Text>
        </View>
        {gains.map((g, i) => (
          <View key={`g${i}`} style={s.row}>
            <Text style={[s.td, s.cDes]}>{g.nom}</Text>
            <Text style={[s.td, s.cTaux]}></Text>
            <Text style={[s.td, s.cGain]}>{fcfa(g.montant)}</Text>
            <Text style={[s.td, s.cRet]}></Text>
          </View>
        ))}
        {retenues.map((r, i) => (
          <View key={`r${i}`} style={s.row}>
            <Text style={[s.td, s.cDes]}>{r.nom}</Text>
            <Text style={[s.td, s.cTaux]}>{taux(r.taux)}</Text>
            <Text style={[s.td, s.cGain]}></Text>
            <Text style={[s.td, s.cRet]}>{fcfa(r.montant)}</Text>
          </View>
        ))}

        <View style={s.totBox}>
          <View style={s.totRow}><Text style={{ color: C.text2 }}>Total brut</Text><Text>{fcfa(fiche.total_brut)}</Text></View>
          <View style={s.totRow}><Text style={{ color: C.text2 }}>Total des retenues</Text><Text>{fcfa(fiche.total_retenues)}</Text></View>
          <View style={s.net}><Text style={s.netTxt}>NET À PAYER</Text><Text style={s.netVal}>{fcfa(fiche.net_a_payer)}</Text></View>
        </View>

        {charges > 0 ? (
          <View style={{ marginTop: 14, backgroundColor: C.bg2, borderRadius: 4, padding: 10 }}>
            <Text style={s.label}>Information employeur</Text>
            <Text style={s.val}>
              Charges patronales : {fcfa(charges)} · Coût total pour l'employeur : {fcfa((fiche.total_brut || 0) + charges)}
            </Text>
          </View>
        ) : null}

        <View style={s.sigRow}>
          <View style={s.sig}><Text style={s.label}>L'employeur</Text></View>
          <View style={s.sig}><Text style={s.label}>Le salarié (lu et approuvé)</Text></View>
        </View>

        <View style={s.footer}>
          <View style={s.footLine}>
            <Text style={s.footTxt}>Les Résidences H2O — Villa Poton, ancienne route de Bassam, au lac, Côte d'Ivoire</Text>
            <Text style={s.footTxt}>Document confidentiel — à conserver.</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
