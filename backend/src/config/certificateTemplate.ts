export interface CertificateTemplateConfig {
  pageSize: string | [number, number];
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fonts: {
    brand: {
      family: string;
      size: number;
    };
    title: {
      family: string;
      size: number;
    };
    body: {
      family: string;
      size: number;
    };
    footer: {
      family: string;
      size: number;
    };
  };
  colors: {
    primary: string;
    secondary: string;
    gold: string;
    mutedGold: string;
    text: string;
    mutedText: string;
  };
  layout: {
    page: {
      width: number;
      height: number;
    };
    brand: {
      text: string;
      tagline: string;
      y: number;
    };
    title: {
      text: string;
      y: number;
    };
    participantName: {
      prefix: string;
      y: number;
    };
    role: {
      prefix: string;
      y: number;
    };
    event: {
      prefix: string;
      y: number;
    };
    date: {
      prefix: string;
      y: number;
    };
    signature: {
      label: string;
      y: number;
      lineWidth: number;
      defaultNames: string[];
    };
    qr: {
      label: string;
      x: number;
      y: number;
      size: number;
    };
    seal: {
      text: string;
      x: number;
      y: number;
      radius: number;
    };
    uniqueId: {
      prefix: string;
      y: number;
    };
  };
}

export const certificateTemplateConfig: CertificateTemplateConfig = {
  pageSize: [1050, 742],
  orientation: 'landscape',
  margins: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  fonts: {
    brand: {
      family: 'Times-Bold',
      size: 18,
    },
    title: {
      family: 'Times-Bold',
      size: 34,
    },
    body: {
      family: 'Times-Roman',
      size: 18,
    },
    footer: {
      family: 'Times-Roman',
      size: 12,
    },
  },

  colors: {
    primary: '#111111',
    secondary: '#2F2F2F',
    gold: '#C8A24A',
    mutedGold: '#E3D2A2',
    text: '#151515',
    mutedText: '#5D5D5D',
  },

  layout: {
    brand: {
      text: 'Proudly Presents',
      tagline: '',
      y: 116,
    },
    page: {
      width: 1050,
      height: 742,
    },
    title: {
      text: 'Certificate of Achievement',
      y: 205,
    },
    participantName: {
      prefix: 'This is to certify that',
      y: 308,
    },
    role: {
      prefix: 'has successfully completed the role of',
      y: 416,
    },
    event: {
      prefix: 'in',
      y: 462,
    },
    date: {
      prefix: 'on',
      y: 514,
    },
    signature: {
      label: 'Head HR',
      y: 618,
      lineWidth: 240,
      defaultNames: ['Priya Sharma', 'Ananya Mehta', 'Rohit Verma'],
    },
    qr: {
      label: 'Scan to verify',
      x: 806,
      y: 579,
      size: 68,
    },
    seal: {
      text: 'Verified Authentic',
      x: 244,
      y: 613,
      radius: 34,
    },
    uniqueId: {
      prefix: 'Certificate ID:',
      y: 687,
    },
  },
};
