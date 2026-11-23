import React from 'react';
import { IconKey } from '../types';

interface CategoryIconProps {
  iconKey: IconKey;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconKey,
  className = 'w-14 h-14',
}) => {
  switch (iconKey) {
    case 'health':
    case 'medical':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#E3F2EE" />
          <rect x="18" y="27" width="44" height="33" rx="9" fill="#247A6B" />
          <path
            d="M31 27 V22 C31 19.5 33 18 35.5 18 H44.5 C47 18 49 19.5 49 22 V27"
            fill="none"
            stroke="#175247"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect x="36.5" y="34" width="7" height="19" rx="2.5" fill="#FFFDF9" />
          <rect x="30.5" y="40" width="19" height="7" rx="2.5" fill="#FFFDF9" />
          <g transform="translate(52, 50) rotate(-32)">
            <rect x="-10" y="-5" width="20" height="10" rx="5" fill="#E67E6E" />
            <path d="M0 -5 H5 A5 5 0 0 1 5 5 H0 Z" fill="#F8E2B4" />
          </g>
        </svg>
      );

    case 'education':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#E4EEF7" />
          <path
            d="M16 30 C24 27 33 28 40 33 C47 28 56 27 64 30 V57 C56 54 47 55 40 59 C33 55 24 54 16 57 Z"
            fill="#FFFDF9"
            stroke="#366591"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <line x1="40" y1="33" x2="40" y2="59" stroke="#366591" strokeWidth="2.5" />
          <line x1="22" y1="38" x2="34" y2="39" stroke="#8CB1D4" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="45" x2="34" y2="46" stroke="#8CB1D4" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="46" y1="39" x2="58" y2="38" stroke="#8CB1D4" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="40,14 58,21 40,28 22,21" fill="#2B5278" />
          <circle cx="57" cy="27" r="3" fill="#E0A545" />
          <line x1="57" y1="21" x2="57" y2="27" stroke="#E0A545" strokeWidth="2" />
        </svg>
      );

    case 'services':
    case 'crafts':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#F6EBDD" />
          <circle cx="46" cy="46" r="14" fill="#D49548" />
          <circle cx="46" cy="46" r="6" fill="#F6EBDD" />
          <g transform="translate(35, 38) rotate(-40)">
            <rect x="-4.5" y="-14" width="9" height="36" rx="4.5" fill="#46585E" />
            <circle cx="0" cy="-16" r="9" fill="#46585E" />
            <rect x="-3.5" y="-23" width="7" height="9" rx="1.5" fill="#F6EBDD" />
          </g>
          <rect x="41" y="18" width="20" height="8" rx="3" transform="rotate(25 51 22)" fill="#B5732C" />
        </svg>
      );

    case 'market':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#E8F0DF" />
          <circle cx="31" cy="34" r="8" fill="#DF725B" />
          <circle cx="43" cy="31" r="9" fill="#639344" />
          <circle cx="51" cy="36" r="7" fill="#E4A93C" />
          <path
            d="M19 37 H61 L55 58 C54 61 51 63 48 63 H32 C29 63 26 61 25 58 Z"
            fill="#C78C43"
          />
          <rect x="16" y="34" width="48" height="6.5" rx="3.25" fill="#A66D28" />
          <line x1="30" y1="44" x2="32" y2="57" stroke="#F6E9D2" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="40" y1="44" x2="40" y2="57" stroke="#F6E9D2" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="44" x2="48" y2="57" stroke="#F6E9D2" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'shop':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#F3E7EC" />
          <rect x="20" y="34" width="40" height="27" rx="4" fill="#FFFDF9" stroke="#8B4D64" strokeWidth="2.5" />
          <rect x="26" y="42" width="12" height="19" rx="2" fill="#8B4D64" />
          <rect x="42" y="42" width="13" height="11" rx="2" fill="#E6C6D2" />
          <path d="M16 26 H64 L66 36 H14 Z" fill="#B56582" />
          <rect x="24" y="26" width="8" height="10" fill="#FAF6F0" />
          <rect x="40" y="26" width="8" height="10" fill="#FAF6F0" />
          <rect x="56" y="26" width="6" height="10" fill="#FAF6F0" />
          <circle cx="20" cy="36" r="4.5" fill="#B56582" />
          <circle cx="28" cy="36" r="4.5" fill="#FAF6F0" />
          <circle cx="36" cy="36" r="4.5" fill="#B56582" />
          <circle cx="44" cy="36" r="4.5" fill="#FAF6F0" />
          <circle cx="52" cy="36" r="4.5" fill="#B56582" />
          <circle cx="60" cy="36" r="4.5" fill="#FAF6F0" />
        </svg>
      );

    case 'transport':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#E2EEF2" />
          <rect x="14" y="57" width="52" height="4" rx="2" fill="#9BBBC7" />
          <path
            d="M17 33 C17 28 21 25 26 25 H52 C57 25 60 28 62 34 L65 43 V53 C65 55 63 57 61 57 H19 C17 57 15 55 15 53 V37 Z"
            fill="#28647A"
          />
          <rect x="21" y="30" width="11" height="10" rx="2" fill="#E8F4F8" />
          <rect x="35" y="30" width="11" height="10" rx="2" fill="#E8F4F8" />
          <path d="M49 30 H57 L60 40 H49 Z" fill="#E8F4F8" />
          <rect x="16" y="44" width="49" height="4" fill="#E5A948" />
          <circle cx="26" cy="57" r="6.5" fill="#233136" />
          <circle cx="26" cy="57" r="2.6" fill="#E8F4F8" />
          <circle cx="54" cy="57" r="6.5" fill="#233136" />
          <circle cx="54" cy="57" r="2.6" fill="#E8F4F8" />
        </svg>
      );

    case 'aid':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#E3EFEA" />
          {/* Helping Hands & Heart */}
          <path
            d="M40 48 C40 48 27 39 27 30.5 C27 26.5 30.2 23.5 34 23.5 C36.8 23.5 38.9 25 40 27 C41.1 25 43.2 23.5 46 23.5 C49.8 23.5 53 26.5 53 30.5 C53 39 40 48 40 48 Z"
            fill="#C96B5E"
          />
          <path
            d="M18 48 C22 44 27 45 31 48 L38 53 H52 C55 53 57 55 57 57.5 C57 60 55 61 52 61 H33 C29 61 25 59 22 56 L17 51 C16 50 16.5 49 18 48 Z"
            fill="#1E5248"
          />
          <path
            d="M62 46 C59 43 55 44 52 46 L46 50"
            fill="none"
            stroke="#C78C43"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'home':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#F5E8E5" />
          <path d="M16 39 L40 19 L64 39" fill="none" stroke="#A3554B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M23 38 L40 24 L57 38 V59 C57 61 55.5 62 53.5 62 H26.5 C24.5 62 23 61 23 59 Z" fill="#FFFDF9" />
          <path
            d="M40 54 C40 54 29 47 29 40.5 C29 37 32 34.5 35 34.5 C37.3 34.5 39.1 35.8 40 37.5 C40.9 35.8 42.7 34.5 45 34.5 C48 34.5 51 37 51 40.5 C51 47 40 54 40 54 Z"
            fill="#C96B5E"
          />
        </svg>
      );

    case 'jobs':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#E6E9F4" />
          <path
            d="M32 28 V23 C32 21 33.5 19.5 35.5 19.5 H44.5 C46.5 19.5 48 21 48 23 V28"
            fill="none"
            stroke="#364673"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <rect x="18" y="28" width="44" height="32" rx="7" fill="#485A8C" />
          <path d="M18 35 C18 31 21 28 25 28 H55 C59 28 62 31 62 35 V42 H18 Z" fill="#5D71A8" />
          <rect x="35" y="38" width="10" height="8" rx="2.5" fill="#E2AC49" />
        </svg>
      );

    case 'ads':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#F8EAE2" />
          <path
            d="M20 35 L47 23 V53 L20 43 Z"
            fill="#C96B43"
            stroke="#9B4A28"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="47" y="21" width="6" height="34" rx="3" fill="#E5A948" />
          <path
            d="M26 44 L29 57 C29.5 59 31.5 60 33.5 59.5 L35.5 59 C37 58.5 37.5 57 37 55 L34 45"
            fill="#46585E"
          />
          <path d="M57 31 C61 34 61 42 57 45" fill="none" stroke="#C96B43" strokeWidth="3" strokeLinecap="round" />
          <path d="M62 27 C68 33 68 43 62 49" fill="none" stroke="#E5A948" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'delivery':
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#E2F1EE" />
          <rect x="14" y="57" width="52" height="3.5" rx="1.75" fill="#9AC5BC" />
          <rect x="19" y="28" width="20" height="17" rx="3.5" fill="#D89240" />
          <line x1="25" y1="28" x2="25" y2="35" stroke="#FAF6F0" strokeWidth="3" />
          <path
            d="M22 45 H46 L52 33 H59 L54 49 H24 C21 49 20 47 22 45 Z"
            fill="#1F7A70"
          />
          <path d="M50 25 H58" stroke="#2B3D3A" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="60" cy="36" r="3.2" fill="#F2C15A" />
          <circle cx="27" cy="54" r="6.5" fill="#233136" />
          <circle cx="27" cy="54" r="2.6" fill="#E2F1EE" />
          <circle cx="54" cy="54" r="6.5" fill="#233136" />
          <circle cx="54" cy="54" r="2.6" fill="#E2F1EE" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#E6EDE9" />
          <rect x="22" y="22" width="16" height="16" rx="4" fill="#1E5248" />
          <rect x="42" y="22" width="16" height="16" rx="4" fill="#C99342" />
          <rect x="22" y="42" width="16" height="16" rx="4" fill="#4C7D72" />
          <rect x="42" y="42" width="16" height="16" rx="4" fill="#1E5248" />
        </svg>
      );
  }
};
