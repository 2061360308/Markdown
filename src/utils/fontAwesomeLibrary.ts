// Desc: This file is used to import the icons that are used in the application.
// sort by the icon name
// 这是一个用于导入应用程序中使用的图标的文件。
// 按图标名称排序

import { library } from "@fortawesome/fontawesome-svg-core";

import {
  faAlignLeft,
  faAnglesUp,
  faAnglesDown,
  faArrowsRotate,
  faArrowUp19,
  faCalendarDays,
  faChevronDown,
  faChevronRight,
  faClock,
  faCircleCheck,
  faCircleExclamation,
  faCodeBranch,
  faCopy,
  faD,
  faFile,
  faFileShield,
  faFloppyDisk,
  faFolder,
  faFolderOpen,
  faGear,
  faInbox,
  faICursor,
  faKey,
  faList,
  faMagnifyingGlass,
  faN,
  faPaste,
  faPenRuler,
  faPlus,
  faRotateLeft,
  faSquareCheck,
  faSquarePen,
  faTrash,
  faU,
  faWonSign,
} from "@fortawesome/free-solid-svg-icons";

import { faGithub, faTumblr } from "@fortawesome/free-brands-svg-icons";

export const initFontAwesomeIcons = () => {
  library.add(
    faAlignLeft,
    faAnglesUp,
    faAnglesDown,
    faArrowsRotate,
    faArrowUp19,
    faCalendarDays,
    faChevronDown,
    faChevronRight,
    faClock,
    faCircleCheck,
    faCircleExclamation,
    faCodeBranch,
    faCopy,
    faD,
    faFile,
    faFileShield,
    faFloppyDisk,
    faFolder,
    faFolderOpen,
    faGear,
    faInbox,
    faGithub,
    faICursor,
    faKey,
    faList,
    faMagnifyingGlass,
    faN,
    faPaste,
    faPenRuler,
    faPlus,
    faRotateLeft,
    faSquareCheck,
    faSquarePen,
    faTrash,
    faTumblr,
    faU,
    faWonSign
  );
};

export default initFontAwesomeIcons;
