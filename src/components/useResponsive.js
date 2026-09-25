import { useWindowDimensions } from 'react-native';
import { breakpoints } from '../theme';

/*
  Hook responsive: classifica lo schermo in phone / tablet / desktop
  e fornisce comodi flag per adattare i layout (griglie, larghezze).
*/
export default function useResponsive() {
  const { width } = useWindowDimensions();
  const isTablet = width >= breakpoints.tablet;
  const isDesktop = width >= breakpoints.desktop;
  // numero di colonne suggerito per griglie di card
  const columns = isDesktop ? 3 : isTablet ? 2 : 1;
  return { width, isPhone: !isTablet, isTablet, isDesktop, columns };
}
