import { 
  User, 
  Ghost, 
  Cat, 
  Dog, 
  Bird, 
  Rabbit, 
  Gamepad2, 
  Rocket, 
  Lightbulb, 
  Brain, 
  ShieldCheck, 
  Award, 
  Trophy, 
  Zap, 
  Star, 
  Flame, 
  Crown,
  Heart,
  Music,
  Camera,
  Diamond,
  Hexagon,
  Feather
} from 'lucide-react';
import { League } from './types';

export const MAX_ENERGY = 25;

export const LEAGUES: League[] = [
  { id: 'bronze', name: 'Bronze League', color: 'text-amber-800', fill: 'fill-amber-800', promoteTop: 15, demoteBottom: 0 },
  { id: 'silver', name: 'Silver League', color: 'text-slate-400', fill: 'fill-slate-400', promoteTop: 10, demoteBottom: 5 },
  { id: 'gold', name: 'Gold League', color: 'text-yellow-500', fill: 'fill-yellow-500', promoteTop: 10, demoteBottom: 5 },
  { id: 'platinum', name: 'Platinum League', color: 'text-cyan-600', fill: 'fill-cyan-600', promoteTop: 7, demoteBottom: 5 },
  { id: 'diamond', name: 'Diamond League', color: 'text-cyan-400', fill: 'fill-cyan-400', promoteTop: 5, demoteBottom: 5 },
  { id: 'master', name: 'Master League', color: 'text-indigo-600', fill: 'fill-indigo-600', promoteTop: 0, demoteBottom: 5 },
];

export const AVATARS = [
  { id: 'user', icon: User, label: 'Default' },
  { id: 'cat', icon: Cat, label: 'Kitten' },
  { id: 'dog', icon: Dog, label: 'Puppy' },
  { id: 'ghost', icon: Ghost, label: 'Spooky' },
  { id: 'bird', icon: Bird, label: 'Phoenix' },
  { id: 'rabbit', icon: Rabbit, label: 'Bunny' },
  { id: 'gamer', icon: Gamepad2, label: 'Gamer' },
  { id: 'rocket', icon: Rocket, label: 'Explorer' },
  { id: 'brain', icon: Brain, label: 'Genius' },
  { id: 'shield', icon: ShieldCheck, label: 'Guardian' },
];

export const THEMES = [
  { id: 'blue', label: 'Classic Blue', primary: '#2196f3', secondary: '#e3f2fd', shadow: '#1e88e5' },
  { id: 'purple', label: 'Royal Purple', primary: '#9c27b0', secondary: '#f3e5f5', shadow: '#7b1fa2' },
  { id: 'green', label: 'Emerald City', primary: '#10b981', secondary: '#ecfdf5', shadow: '#059669' },
  { id: 'red', label: 'Sunset Red', primary: '#ef4444', secondary: '#fef2f2', shadow: '#dc2626' },
  { id: 'orange', label: 'Sunny Orange', primary: '#f59e0b', secondary: '#fffbeb', shadow: '#d97706' },
  { id: 'pink', label: 'Magical Pink', primary: '#ec4899', secondary: '#fdf2f8', shadow: '#db2777' },
];

export const ALL_BADGES = [
  { id: 'b1', name: 'AI Explorer', requirement: 'Complete Module 1.1', icon: Star, color: 'text-blue-500' },
  { id: 'b2', name: 'AI Spotter', requirement: 'Identify AI correctly 10 times', icon: Camera, color: 'text-emerald-500' },
  { id: 'b3', name: 'Pattern Detective', requirement: 'Complete Level 2 with 80%+ accuracy', icon: Brain, color: 'text-purple-500' },
  { id: 'b4', name: 'Data Cleaner', requirement: 'Identify errors in a dataset', icon: Feather, color: 'text-orange-500' },
  { id: 'b5', name: 'Fairness Champion', requirement: 'Correctly identify bias type in 3 cases', icon: ShieldCheck, color: 'text-indigo-500' },
  { id: 'b6', name: 'Digital Privacy Guard', requirement: 'Complete Module 3.4 with 85%+ accuracy', icon: Heart, color: 'text-rose-500' },
  { id: 'b7', name: 'Logic Architect', requirement: 'Debug a broken decision tree', icon: Hexagon, color: 'text-blue-600' },
  { id: 'b8', name: 'Ethics Judge', requirement: 'Deliver a FAIR-framework verdict', icon: Award, color: 'text-yellow-600' },
];
