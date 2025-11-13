export type DataSourceType = "html" | "pdf" | "rss";

export interface DataSource {
  url: string;
  type: DataSourceType;
  rss?: string;
  name: string;
  category: string;
}

export const DATA_SOURCES: Record<string, DataSource[]> = {
  central: [
    {
      name: "Ministry of Finance",
      url: "https://www.finmin.gov.in/",
      type: "html",
      category: "central"
    },
    {
      name: "Press Information Bureau",
      url: "https://pib.gov.in/AllRelease.aspx",
      type: "html",
      category: "central"
    },
    {
      name: "Department of Revenue",
      url: "https://dor.gov.in/",
      type: "html",
      category: "central"
    },
    {
      name: "Income Tax Notifications",
      url: "https://incometaxindia.gov.in/Lists/Latest%20News/AllItems.aspx",
      type: "html",
      category: "central"
    },
    {
      name: "Income Tax Circulars",
      url: "https://incometaxindia.gov.in/Lists/Circulars/AllItems.aspx",
      type: "html",
      category: "central"
    },
    {
      name: "CBIC GST",
      url: "https://www.cbic.gov.in/htdocs-cbec/gst/",
      type: "html",
      category: "central"
    },
    {
      name: "Customs",
      url: "https://www.cbic.gov.in/htdocs-cbec/customs",
      type: "html",
      category: "central"
    },
    {
      name: "Excise",
      url: "https://www.cbic.gov.in/htdocs-cbec/excise",
      type: "html",
      category: "central"
    }
  ],
  maharashtra: [
    {
      name: "Maharashtra GST Notifications",
      url: "https://mahagst.gov.in/en/notifications",
      type: "html",
      category: "maharashtra"
    },
    {
      name: "Maharashtra GST Updates",
      url: "https://mahagst.gov.in/en/latest-updates",
      type: "html",
      category: "maharashtra"
    }
  ],
  regulators: [
    {
      name: "RBI Notifications",
      url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx",
      type: "html",
      rss: "https://www.rbi.org.in/scripts/RSSDisplay.aspx?f=Press",
      category: "regulators"
    },
    {
      name: "SEBI Circulars",
      url: "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=2",
      type: "html",
      category: "regulators"
    },
    {
      name: "IRDAI",
      url: "https://irdai.gov.in/circulars",
      type: "html",
      category: "regulators"
    }
  ]
};

export function getAllDataSources(): DataSource[] {
  return Object.values(DATA_SOURCES).flat();
}

export function getDataSourcesByCategory(category: string): DataSource[] {
  return DATA_SOURCES[category] || [];
}
