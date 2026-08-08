export interface Category { id:string; icon:string; title:string; subtitle:string; gradient:string[]; songCount:number; }
export interface MockSong { id:string; title:string; artist:string; duration:number; streamCount:number; verified:boolean; genre:string; price:number; }

export const mkSongs: MockSong[] = [
  { id:'s1',title:'Sitya Loss',artist:'Eddy Kenzo',duration:235,streamCount:1250000,verified:true,genre:'Dancehall',price:2000 },
  { id:'s2',title:'Sweet Sensation',artist:'Sheebah',duration:210,streamCount:980000,verified:true,genre:'Afrobeat',price:1500 },
  { id:'s3',title:'Tokigeza',artist:'David Lutalo',duration:198,streamCount:780000,verified:true,genre:'Kidandali',price:1500 },
  { id:'s4',title:'Pull Up',artist:'Joshua Baraka',duration:245,streamCount:650000,verified:true,genre:'Afrobeat',price:2000 },
  { id:'s5',title:'Onkosa',artist:'Lydia Jazmine',duration:220,streamCount:520000,verified:true,genre:'R&B',price:1500 },
  { id:'s6',title:'Bango',artist:'Winnie Nwagi',duration:215,streamCount:890000,verified:true,genre:'Dancehall',price:2000 },
  { id:'s7',title:'Munda Awo',artist:'B2C',duration:205,streamCount:450000,verified:true,genre:'Afrobeat',price:1500 },
  { id:'s8',title:'Tumbiza Sound',artist:'Gnome',duration:195,streamCount:1100000,verified:false,genre:'Lugaflow',price:1000 },
  { id:'s9',title:'Ekyama',artist:'Feffe Bussi',duration:210,streamCount:380000,verified:false,genre:'Lugaflow',price:1000 },
  { id:'s10',title:'Ndi Mu Love',artist:'Spice Diana',duration:225,streamCount:720000,verified:true,genre:'Afrobeat',price:2000 },
];

const categoryMap: Record<string, string[]> = {
  'trending-kampala':['s1','s2','s4','s6','s8','s10','s3','s5','s7'],
  'new-artists':['s8','s9'],
  'tiktok-viral':['s8','s1','s6','s4'],
  'fresh-dancehall':['s1','s6','s2'],
  'lugaflow':['s8','s9','s1'],
  'gospel-hits':['s7','s3','s5'],
  'party-mixes':['s1','s6','s8','s10'],
  'radio-charts':['s1','s2','s10','s6','s4'],
  'editor-picks':['s4','s10','s1','s5'],
  'hidden-gems':['s8','s9','s7'],
};

export function getSongsForCategory(categoryId: string): MockSong[] {
  const ids = categoryMap[categoryId] || mkSongs.slice(0, 5).map(s => s.id);
  return ids.map(id => mkSongs.find(s => s.id === id)!).filter(Boolean);
}
