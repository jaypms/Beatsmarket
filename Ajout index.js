import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Home() {
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchBeats = async () => {
      try {
        const beatsRef = collection(db, 'beats');
        const q = query(beatsRef, where('isPublic', '==', true));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBeats(data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur récupération des beats :', error);
        setLoading(false);
      }
    };

    fetchBeats();
  }, []);

  const styles = ['all', 'Trap', 'Drill', 'RnB', 'Boom Bap', 'Afro', 'Autre'];
  const filtered = filter === 'all' ? beats : beats.filter(b => b.style === filter);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1 style={{ textAlign: 'center', fontSize: 26 }}>🎧 BeatsMarket</h1>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label>🎵 Style :</label>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: 5, marginLeft: 8 }}
        >
          {styles.map(style => (
            <option key={style} value={style}>
              {style === 'all' ? 'Tous les styles' : style}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Chargement...</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Aucun beat trouvé</p>
      ) : (
        filtered.map(beat => (
          <div
            key={beat.id}
            style={{
              marginBottom: 25,
              border: '1px solid #ccc',
              borderRadius: 10,
              padding: 15,
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            <h2>{beat.title}</h2>
            <p>🎼 {beat.style}</p>
            <p>💰 {beat.price} €</p>
            <p>
              👤 Beatmaker :{' '}
              <Link href={`/beatmaker/${beat.userId}`}>
                <a style={{ color: '#0070f3', textDecoration: 'underline' }}>
                  Voir sa boutique
                </a>
              </Link>
            </p>

            <ProtectedPlayer
              previewUrl={beat.previewUrl}
              watermarkUrl="/watermark.mp3"
            />

            <div style={{ marginTop: 10 }}>
              <Link href={`/beat/${beat.id}`}>
                <a
                  style={{
                    backgroundColor: '#0070f3',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: 6,
                    textDecoration: 'none',
                  }}
                >
                  Voir le beat
                </a>
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ProtectedPlayer({ previewUrl, watermarkUrl }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let audioCtx = null;
    let beatSource = null;
    let watermarkBuffer = null;
    let interval = null;

    const playWithProtection = async () => {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      const [beatBuf, markBuf] = await Promise.all([
        fetch(previewUrl).then(res => res.arrayBuffer()).then(buf => audioCtx.decodeAudioData(buf)),
        fetch(watermarkUrl).then(res => res.arrayBuffer()).then(buf => audioCtx.decodeAudioData(buf)),
      ]);

      watermarkBuffer = markBuf;

      beatSource = audioCtx.createBuffer
