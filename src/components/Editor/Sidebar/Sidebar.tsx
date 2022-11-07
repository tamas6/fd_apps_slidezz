import fscreen from 'fscreen'
import { FaPlay } from 'react-icons/fa'

import { Box, useColorModeValue } from '@chakra-ui/react'

import AddLogoImage from './AddLogoImage'
import SaveSlides from './SaveSlides'
import PresentationSettings from './Settings/SlideShowSettings'
import StyleSettings from './Settings/StyleSettings/StyleSettings'
import ShareSlides from './ShareSlides/ShareSlides'
import SideBarItem from './SidebarItem'

interface SidebarProps {
  isSlidesReadOnly?: boolean
}

export default function Sidebar({ isSlidesReadOnly }: SidebarProps) {
  return (
    <Box
      bg={useColorModeValue('latte-crust', 'frappe-crust')}
      fontSize={{ base: 'xl', md: '2xl' }}
      w="5rem"
      h="90%"
      my="auto"
      overflow="hidden"
    >
      <SideBarItem
        icon={FaPlay}
        label="Present"
        onClick={() => {
          fscreen.requestFullscreen(document.querySelector('.reveal')!)
        }}
      />

      <PresentationSettings />
      <StyleSettings />

      {!isSlidesReadOnly && (
        <>
          <AddLogoImage />
          <SaveSlides />
          <ShareSlides />
        </>
      )}
    </Box>
  )
}
