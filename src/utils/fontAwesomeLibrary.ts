// Desc: This file is used to import the icons that are used in the application.
// sort by the icon name
// 这是一个用于导入应用程序中使用的图标的文件。
// 按图标名称排序

import { library } from "@fortawesome/fontawesome-svg-core";

import {
  faAnglesUp,
  faAnglesDown,
  faArrowsRotate,
  faChevronDown,
  faChevronRight,
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
  faMagnifyingGlass,
  faN,
  faPenRuler,
  faPlus,
  faRotateLeft,
  faSquarePen,
  faTrash,
  faU,
  faWonSign,
} from "@fortawesome/free-solid-svg-icons";

import { faGithub, faTumblr } from "@fortawesome/free-brands-svg-icons";

export const initFontAwesomeIcons = () => {
  library.add(
    faAnglesUp,
    faAnglesDown,
    faArrowsRotate,
    faChevronDown,
    faChevronRight,
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
    faMagnifyingGlass,
    faN,
    faPenRuler,
    faPlus,
    faRotateLeft,
    faSquarePen,
    faTrash,
    faTumblr,
    faU,
    faWonSign
  );
};

export default initFontAwesomeIcons;
