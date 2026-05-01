import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// In a real app, these would be in separate JSON files under public/locales/
const resources = {
  en: {
    translation: {
      "app_name": "Saraswati Shishu Vidya Mandir",
      "dashboard": "Dashboard",
      "directory": "Directory",
      "fees": "Fees",
      "attendance": "Attendance",
      "classes": "Classes",
      "welcome": "Welcome back, Admin",
      "total_students": "Total Students",
      "total_teachers": "Total Teachers",
      "fee_collection": "Fee Collection",
      "today_attendance": "Today's Attendance",
      "recent_activities": "Recent Activities",
      "search": "Search...",
      "add_new": "Add New",
      "students": "Students",
      "teachers": "Teachers",
      "name": "Name",
      "class": "Class",
      "status": "Status",
      "actions": "Actions",
      "present": "Present",
      "absent": "Absent",
      "late": "Late",
      "paid": "Paid",
      "pending": "Pending",
      "receipt": "Receipt"
    }
  },
  or: {
    translation: {
      "app_name": "ସରସ୍ୱତୀ ଶିଶୁ ବିଦ୍ୟା ମନ୍ଦିର",
      "dashboard": "ଡ୍ୟାସବୋର୍ଡ",
      "directory": "ଡିରେକ୍ଟୋରୀ",
      "fees": "ଫିସ୍",
      "attendance": "ଉପସ୍ଥାନ",
      "classes": "ଶ୍ରେଣୀଗୁଡିକ",
      "welcome": "ସ୍ୱାଗତମ୍, ଆଡମିନ୍",
      "total_students": "ମୋଟ ଛାତ୍ର",
      "total_teachers": "ମୋଟ ଶିକ୍ଷକ",
      "fee_collection": "ଫି ଆଦାୟ",
      "today_attendance": "ଆଜିର ଉପସ୍ଥାନ",
      "recent_activities": "ସାମ୍ପ୍ରତିକ କାର୍ଯ୍ୟକଳାପ",
      "search": "ସନ୍ଧାନ କରନ୍ତୁ...",
      "add_new": "ନୂତନ ଯୋଡନ୍ତୁ",
      "students": "ଛାତ୍ରଛାତ୍ରୀ",
      "teachers": "ଶିକ୍ଷକ",
      "name": "ନାମ",
      "class": "ଶ୍ରେଣୀ",
      "status": "ସ୍ଥିତି",
      "actions": "କାର୍ଯ୍ୟଗୁଡ଼ିକ",
      "present": "ଉପସ୍ଥିତ",
      "absent": "ଅନୁପସ୍ଥିତ",
      "late": "ବିଳମ୍ବ",
      "paid": "ପୈଠ",
      "pending": "ବାକି",
      "receipt": "ରସିଦ"
    }
  },
  hi: {
    translation: {
      "app_name": "सरस्वती शिशु विद्या मंदिर",
      "dashboard": "डैशबोर्ड",
      "directory": "निर्देशिका",
      "fees": "फीस",
      "attendance": "उपस्थिति",
      "classes": "कक्षाएं",
      "welcome": "वापसी पर स्वागत है, एडमिन",
      "total_students": "कुल छात्र",
      "total_teachers": "कुल शिक्षक",
      "fee_collection": "फीस संग्रह",
      "today_attendance": "आज की उपस्थिति",
      "recent_activities": "हाल की गतिविधियां",
      "search": "खोजें...",
      "add_new": "नया जोड़ें",
      "students": "छात्र",
      "teachers": "शिक्षक",
      "name": "नाम",
      "class": "कक्षा",
      "status": "स्थिति",
      "actions": "कार्रवाइयां",
      "present": "उपस्थित",
      "absent": "अनुपस्थित",
      "late": "देर से",
      "paid": "भुगतान किया",
      "pending": "लंबित",
      "receipt": "रसीद"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
