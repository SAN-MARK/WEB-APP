import { FoundItem, RecoveryHub } from '../types';

export const CHENNAI_HUBS: RecoveryHub[] = [
  {
    id: 'adyar',
    name: 'Adyar Hub, Chennai',
    address: 'Gate No 2, Near Adyar Depot, LB Road, Chennai - 600020',
    distance: '1.2 KM',
    gate: 'Gate No. 2 Depot',
    latitude: 13.0033,
    longitude: 80.2550
  },
  {
    id: 'tnagar',
    name: 'T. Nagar Community Hub',
    address: '42nd Street, Beside Metro Gate A, T. Nagar, Chennai - 600017',
    distance: '1.8 KM',
    gate: 'Gate No. 3 Counter',
    latitude: 13.0405,
    longitude: 80.2337
  },
  {
    id: 'annanagar',
    name: 'Anna Nagar West Hub',
    address: 'Main Avenue, Near Anna Nagar Arch, Chennai - 600040',
    distance: '2.4 KM',
    gate: 'Reception Desk',
    latitude: 13.0850,
    longitude: 80.2101
  },
  {
    id: 'velachery',
    name: 'Velachery Recovery Hub',
    address: '100 Feet Bypass Road, Opposite Phoenix Marketcity, Chennai - 600042',
    distance: '3.5 KM',
    gate: 'Helpdesk 1A',
    latitude: 12.9801,
    longitude: 80.2228
  },
  {
    id: 'central',
    name: 'Chennai Central Hub',
    address: 'Platform 1 Concourse, Puratchi Thalaivar Dr. M.G. Ramachandran Central Railway Station, Chennai - 600003',
    distance: '4.0 KM',
    gate: 'Platform 1 Help Desk',
    latitude: 13.0827,
    longitude: 80.2707
  }
];

export const INITIAL_ITEMS: FoundItem[] = [
  {
    id: 'item-1',
    category: 'Wallet',
    name: 'Black Leather Bifold',
    location: 'Adyar Hub, Chennai',
    date: '2 days ago',
    hubId: 'adyar',
    status: 'Found',
    blurImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0vaabrFIVpkb0hl-Y02m8D2jBnEz6loFtLB2XdkMf22vPKh8MYjP48NHimS377cQlguFvOkCCfKjRuKKx-MHH4BvAwGkRRmhyxUfL3EckE5yM9d3oldCISh9RoRXoKlSWxI0sTvmgZMBn8vVLIfMHZZle5TkoXQdmTypj8pS6zOL8TGohTC-Yl6YKPfrvvrxhEpWhhH8iqxEJngiMieaIUxG5637Wk8U1X65l7fuCfF9vyQK81s1mGKo5x84m8vCJxeVOBHuoBn6V',
    clearImg: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400',
    submissionId: 'FB-441-3901',
    description: 'Genuine black leather bifold wallet with multiple card slots and an identity card inside.',
    reporterName: 'Sathish Kumar',
    reporterEmail: 'sathish.k@gmail.com',
    rewardAmount: 60,
    serviceFee: 200,
    hasPaidEscrow: false
  },
  {
    id: 'item-2',
    category: 'Keys',
    name: 'Silver Keychain set',
    location: 'T. Nagar Metro',
    date: 'Today',
    hubId: 'tnagar',
    status: 'Found',
    blurImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDitxzszzX07L52mpJg5CYLz1BpxRVyD2Cm1u1FuUzSqoqC1AOYf-NEeIg9612Km-KaEBGHn7-Q51sGOZBWUkI20USfUb1VvK-wjz_7PRhLRufvoWsrNfQAR_gFHOEstHy2fQZPXxGLJ7UOMf08kOvGi8-WaDe8zshGM8VAbo7xoUNDZ5JL7Y6NI8fZYYtQNj0TlKBjmJg0nb9brZEmwZYYcsCJ5mAF_x2HUYy_JtZJx5sd745LgbWlkt3PPZvlovTkZ--bbfT04JWn',
    clearImg: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=400',
    submissionId: 'FB-882-9910',
    description: 'Set of 3 keys with a small metallic ring and a grey custom Chennai metro travel card pouch attached.',
    reporterName: 'Arun Prasath',
    reporterEmail: 'arun95@outlook.com',
    rewardAmount: 60,
    serviceFee: 200,
    hasPaidEscrow: false
  },
  {
    id: 'item-3',
    category: 'Electronics',
    name: 'Laptop Case (Blue)',
    location: 'Anna Nagar West',
    date: '5 days ago',
    hubId: 'annanagar',
    status: 'Found',
    blurImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEpAJ-lhGR1WUgvwPr9auHDvcd1LyF6YwaDZnU8IjVl6MWqR0RaYRqEh11ZbEqcK61EtM9D2fYNdFMCbh2dCCVYCNRe82fxfIymhLSX-q1DWtrktuakxUWxHJUcvJMQo1DlOx-hxgAUHynMU5GxmRnVWWtsIbVYJDwzS8cPAmQH2NZSQyyLQ_jQoAf8MqojgALDFriP-7bYxcIXGRoOiu8bzAbUwKgGQ2c3IppvM3iTTK_ghch0yojVd9ikBeB2MEuPo6JeCbzOOCQ',
    clearImg: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
    submissionId: 'FB-104-5821',
    description: 'Dark blue padded laptop sleeve. Fits 14-inch laptops. Has an empty external zipped pocket.',
    reporterName: 'Priya Rajan',
    reporterEmail: 'priya.rajan@live.com',
    rewardAmount: 120,
    serviceFee: 400,
    hasPaidEscrow: false
  },
  {
    id: 'item-4',
    category: 'Phone',
    name: 'OnePlus Nord 3',
    location: 'Velachery Hub, Chennai',
    date: '3 days ago',
    hubId: 'velachery',
    status: 'Dropped at Hub',
    blurImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEpAJ-lhGR1WUgvwPr9auHDvcd1LyF6YwaDZnU8IjVl6MWqR0RaYRqEh11ZbEqcK61EtM9D2fYNdFMCbh2dCCVYCNRe82fxfIymhLSX-q1DWtrktuakxUWxHJUcvJMQo1DlOx-hxgAUHynMU5GxmRnVWWtsIbVYJDwzS8cPAmQH2NZSQyyLQ_jQoAf8MqojgALDFriP-7bYxcIXGRoOiu8bzAbUwKgGQ2c3IppvM3iTTK_ghch0yojVd9ikBeB2MEuPo6JeCbzOOCQ', // generic fallback blurred
    clearImg: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=400',
    submissionId: 'FB-938-1123',
    description: 'Sage green OnePlus Nord 3 with a clear silicone cover. Screen has a tiny scratch on the top left corner.',
    reporterName: 'Vikram Seth',
    reporterEmail: 'vikram.seth@gmail.com',
    rewardAmount: 150,
    serviceFee: 500,
    hasPaidEscrow: false
  },
  {
    id: 'item-5',
    category: 'Jewellery',
    name: 'Gold Ring',
    location: 'Chennai Central',
    date: '1 week ago',
    hubId: 'central',
    status: 'Found',
    blurImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDitxzszzX07L52mpJg5CYLz1BpxRVyD2Cm1u1FuUzSqoqC1AOYf-NEeIg9612Km-KaEBGHn7-Q51sGOZBWUkI20USfUb1VvK-wjz_7PRhLRufvoWsrNfQAR_gFHOEstHy2fQZPXxGLJ7UOMf08kOvGi8-WaDe8zshGM8VAbo7xoUNDZ5JL7Y6NI8fZYYtQNj0TlKBjmJg0nb9brZEmwZYYcsCJ5mAF_x2HUYy_JtZJx5sd745LgbWlkt3PPZvlovTkZ--bbfT04JWn', // generic fallback blurred
    clearImg: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
    submissionId: 'FB-112-9018',
    description: 'Gold band ring with simple patterns engraved on the outer surface. Weighs around 4 grams.',
    reporterName: 'Meera Krishnan',
    reporterEmail: 'meera.krish@gmail.com',
    rewardAmount: 300,
    serviceFee: 1000,
    hasPaidEscrow: false
  }
];
