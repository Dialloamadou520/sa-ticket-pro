-- Catégories par défaut pour Sa Ticket Pro
insert into public.categories (slug, name, icon) values
  ('concerts',    'Concerts',         'Music'),
  ('festivals',   'Festivals',        'PartyPopper'),
  ('sport',       'Sport',            'Trophy'),
  ('conferences', 'Conférences',      'Mic'),
  ('soirees',     'Soirées',          'Sparkles'),
  ('theatre',     'Théâtre & Arts',   'Drama'),
  ('formations',  'Formations',       'GraduationCap'),
  ('tech',        'Tech & Startups',  'Cpu')
on conflict (slug) do nothing;
