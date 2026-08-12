// The event bank. Each entry: a moment in LoL esports history.
// Rules for writing entries:
//  - No years or dates in title/desc (that would give the answer away).
//  - `date` is ISO yyyy-mm-dd and is only revealed after the game ends.
//  - Keep descriptions to one sentence.
// Add more events here — the daily picker handles any bank size >= 5.

export const EVENTS = [
  {
    id: 's1-worlds',
    date: '2011-06-20',
    title: 'The first World Championship',
    desc: "Fnatic defeat against All authority at DreamHack Summer to become League's first-ever world champions.",
  },
  {
    id: 's2-worlds',
    date: '2012-10-13',
    title: 'Taipei Assassins shock the world',
    desc: 'TPA upset the heavily favored Azubu Frost in Los Angeles to claim the Summoner’s Cup.',
  },
  {
    id: 'xpeke-backdoor',
    date: '2013-01-19',
    title: '“xPeke!”',
    desc: "Fnatic's mid laner solo-backdoors SK Gaming's nexus on Kassadin at IEM Katowice, turning his name into a verb.",
  },
  {
    id: 'faker-debut',
    date: '2013-04-06',
    title: 'A rookie called Faker',
    desc: 'An unknown SKT trainee solo-kills Ambition mid lane on his competitive debut.',
  },
  {
    id: 'faker-ryu-zed',
    date: '2013-08-31',
    title: 'The Zed vs Zed outplay',
    desc: 'Faker turns on Ryu in a Zed mirror during an OGN Champions final, producing the most replayed clip in LoL history.',
  },
  {
    id: 's3-worlds',
    date: '2013-10-04',
    title: 'SKT’s first Summoner’s Cup',
    desc: 'SK Telecom T1 beat Royal Club at the Staples Center to win their first world title.',
  },
  {
    id: 'ssw-worlds',
    date: '2014-10-19',
    title: 'Samsung White’s masterclass',
    desc: 'The most dominant Worlds run ever ends with Samsung White lifting the Cup in Seoul.',
  },
  {
    id: 'msi-first',
    date: '2015-05-10',
    title: 'EDG win the first MSI',
    desc: 'Edward Gaming stun SKT in five games to win the inaugural Mid-Season Invitational.',
  },
  {
    id: 'fnatic-perfect',
    date: '2015-08-09',
    title: 'The perfect split',
    desc: 'Fnatic finish an EU LCS regular season 18–0, the first perfect split in major-region history.',
  },
  {
    id: 'skt-second',
    date: '2015-10-31',
    title: 'SKT reclaim the throne',
    desc: 'SKT beat the KOO Tigers in Berlin to win their second world title, dropping only one game all tournament.',
  },
  {
    id: 'anx-run',
    date: '2016-10-09',
    title: 'The wildcard miracle',
    desc: 'Albus NoX Luna of Russia’s LCL become the first wildcard team to reach the Worlds knockout stage.',
  },
  {
    id: 'skt-third',
    date: '2016-10-29',
    title: 'Three-time champions',
    desc: 'SKT edge Samsung Galaxy in five games to become the first organization with three Summoner’s Cups.',
  },
  {
    id: 'ssg-revenge',
    date: '2017-11-04',
    title: 'Revenge in the Bird’s Nest',
    desc: 'Samsung Galaxy sweep SKT in Beijing, avenging their finals defeat from the year before.',
  },
  {
    id: 'rng-msi',
    date: '2018-05-20',
    title: 'Uzi finally lifts a trophy',
    desc: 'Royal Never Give Up win MSI in Paris, giving Uzi his first major international title.',
  },
  {
    id: 'tsm-miss',
    date: '2018-09-09',
    title: 'TSM miss Worlds',
    desc: 'For the first time in the organization’s history, TSM fail to qualify for the World Championship.',
  },
  {
    id: 'ig-worlds',
    date: '2018-11-03',
    title: 'China’s first Summoner’s Cup',
    desc: 'Invictus Gaming sweep Fnatic in Incheon to win the LPL’s first world title.',
  },
  {
    id: 'lec-launch',
    date: '2019-01-18',
    title: 'The LEC era begins',
    desc: 'The EU LCS relaunches as the franchised League of Legends European Championship.',
  },
  {
    id: 'g2-msi',
    date: '2019-05-19',
    title: 'G2 speedrun MSI',
    desc: 'G2 beat Team Liquid in the fastest best-of-five in international history to win MSI in Taipei.',
  },
  {
    id: 'fpx-worlds',
    date: '2019-11-10',
    title: 'Doinb’s crowning',
    desc: 'FunPlus Phoenix sweep G2 in Paris to win the Summoner’s Cup in their first Worlds appearance.',
  },
  {
    id: 'uzi-retires',
    date: '2020-06-03',
    title: 'Uzi retires',
    desc: 'The legendary ADC announces his retirement, citing chronic wrist injuries and health concerns.',
  },
  {
    id: 'dwg-worlds',
    date: '2020-10-31',
    title: 'Damwon bring it home',
    desc: 'Damwon Gaming beat Suning in Shanghai’s pandemic bubble, returning the Cup to Korea.',
  },
  {
    id: 'perkz-c9',
    date: '2020-11-20',
    title: 'Perkz crosses the Atlantic',
    desc: 'G2’s franchise player is sold to Cloud9 in one of the biggest transfers in western LoL history.',
  },
  {
    id: 'rekkles-g2',
    date: '2020-11-25',
    title: 'Rekkles joins the rivals',
    desc: 'Fnatic’s star ADC leaves the org he defined to sign with archrival G2 Esports.',
  },
  {
    id: 'edg-worlds',
    date: '2021-11-06',
    title: 'EDG topple the champions',
    desc: 'Edward Gaming upset defending champions DWG KIA in five games in Reykjavik.',
  },
  {
    id: 'drx-miracle',
    date: '2022-11-05',
    title: 'The miracle run completes',
    desc: 'DRX, in from the play-in stage, beat T1 in San Francisco — Deft wins it all at last.',
  },
  {
    id: 'jdg-msi',
    date: '2023-05-21',
    title: 'JDG’s grand-slam bid begins',
    desc: 'JD Gaming win MSI in London, setting up their run at the calendar grand slam.',
  },
  {
    id: 'faker-fourth',
    date: '2023-11-19',
    title: 'The fourth Cup, at home',
    desc: 'T1 sweep Weibo Gaming in Seoul as Faker lifts his fourth Summoner’s Cup.',
  },
  {
    id: 'geng-msi',
    date: '2024-05-19',
    title: 'Chovy breaks through',
    desc: 'Gen.G beat Bilibili Gaming in Chengdu to win MSI — Chovy’s first international title.',
  },
  {
    id: 't1-backtoback',
    date: '2024-11-02',
    title: 'Back-to-back at The O2',
    desc: 'T1 defend their world title against Bilibili Gaming in London.',
  },
  {
    id: 't1-threepeat',
    date: '2025-11-09',
    title: 'The three-peat',
    desc: 'T1 win a third consecutive World Championship in Chengdu — Faker’s sixth title.',
  },
]
