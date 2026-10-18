import { Button } from '@/components/ui/button';
import { useDesign } from '@/logic/design-context';
import { awayList, useStore } from '@/logic/store';
import { formatDate } from '@/logic/rules';

export function CompanyList({ onOpenDevice }: { onOpenDevice: (id: string) => void }) {
  const { t } = useDesign();
  const companies = useStore(s => s.companies);
  const devices = useStore(s => s.devices);
  const away = awayList(devices, companies);
  return <div className="record-list">{companies.map(company => {
    const held = away.filter(a => a.company.id === company.id);
    return <section className="record-section" key={company.id}>
      <h3>{company.name}</h3>
      <div className="detail-row"><span>{t('away')}</span><strong>{held.length}</strong></div>
      <div className="detail-row"><span>{t('late')}</span><strong>{held.filter(a => a.late).length}</strong></div>
      <div className="detail-row"><span>{t('expected')}</span><strong>{company.deadlineDays} {t('dayUnit')}</strong></div>
      {held.map(a => <Button variant="soft" size="touch" key={a.device.id} onClick={() => onOpenDevice(a.device.id)}>{a.device.inventory} · {a.device.brand}</Button>)}
    </section>;
  })}</div>;
}

export function PaperList({ onOpenDevice }: { onOpenDevice: (id: string) => void }) {
  const { t } = useDesign();
  const papers = useStore(s => s.papers);
  const devices = useStore(s => s.devices);
  const companies = useStore(s => s.companies);
  return <div className="record-list">{papers.map(paper => {
    const device = devices.find(d => d.id === paper.deviceId);
    return <Button className="paper-record" variant="soft" size="touch" key={paper.id} onClick={() => onOpenDevice(paper.deviceId)}>
      <strong>{t(paper.kind)}</strong>
      <span>{device?.inventory} · {companies.find(c => c.id === paper.companyId)?.name}</span>
      <time>{formatDate(new Date(paper.date))}</time>
      {paper.kind === 'reception' && device?.returnedNotes && <small>{t('technicianNotes')}: {device.returnedNotes}</small>}
    </Button>;
  })}{!papers.length && <p>{t('noPapers')}</p>}</div>;
}