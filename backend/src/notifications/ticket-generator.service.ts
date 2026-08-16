import { Injectable } from '@nestjs/common';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

@Injectable()
export class TicketGeneratorService {
  private fontBuffer: Buffer | null = null;

  async getFont(): Promise<Buffer> {
    if (this.fontBuffer) return this.fontBuffer;
    // We will use a standard google font for the ticket.
    const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.woff');
    const arrayBuffer = await res.arrayBuffer();
    this.fontBuffer = Buffer.from(arrayBuffer);
    return this.fontBuffer;
  }

  async generateTicketImage(bookingDetails: any): Promise<Buffer> {
    const fontData = await this.getFont();
    const svg = await satori( { /* satori object */
        type: 'div',
        props: {
          style: {
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#fdfbf7', // Off-white/cream paper texture color
            color: '#000000',
            fontFamily: 'Roboto',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            flexDirection: 'column',
          },
          children: [
            // TOP HEADER BAR
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  width: '100%',
                  height: '60px',
                  backgroundColor: '#073359', // Deep oceanic blue
                  alignItems: 'center',
                  padding: '0 40px',
                  borderBottom: '4px solid #c5a880', // Gold accent
                },
                children: {
                  type: 'div',
                  props: {
                    style: { fontSize: '24px', fontWeight: 'bold', color: '#c5a880', letterSpacing: '4px' },
                    children: 'STAY Q CRUISE | BOARDING PASS'
                  }
                }
              }
            },
            // MAIN BODY
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  width: '100%',
                  flex: 1,
                },
                children: [
                  // LEFT AREA (Details)
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        width: '70%',
                        padding: '30px 40px',
                        justifyContent: 'space-between',
                      },
                      children: [
                        // Row 1
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', justifyContent: 'space-between' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Cruise Line' } },
                                    { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold', color: '#073359' }, children: 'STAY Q EXPERIENCES' } },
                                  ]
                                }
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', width: '200px' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Itinerary' } },
                                    { type: 'span', props: { style: { fontSize: '18px', fontWeight: 'bold' }, children: 'Premium Escape' } },
                                  ]
                                }
                              },
                            ]
                          }
                        },
                        // Row 2
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', justifyContent: 'space-between' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Passenger Name' } },
                                    { type: 'span', props: { style: { fontSize: '22px', fontWeight: 'bold' }, children: bookingDetails.guestName || 'Valued Guest' } },
                                  ]
                                }
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', width: '200px' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Booking Reference' } },
                                    { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold' }, children: `#${bookingDetails.confirmationCode || 'SQ-VIP-001'}` } },
                                  ]
                                }
                              },
                            ]
                          }
                        },
                        // Row 3
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', justifyContent: 'space-between' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Departure' } },
                                    { type: 'span', props: { style: { fontSize: '18px', fontWeight: 'bold' }, children: bookingDetails.checkIn ? new Date(bookingDetails.checkIn).toLocaleDateString() : 'TBD' } },
                                  ]
                                }
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', width: '200px' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Disembark' } },
                                    { type: 'span', props: { style: { fontSize: '18px', fontWeight: 'bold' }, children: bookingDetails.checkOut ? new Date(bookingDetails.checkOut).toLocaleDateString() : 'TBD' } },
                                  ]
                                }
                              },
                            ]
                          }
                        },
                        // Row 4
                        {
                          type: 'div',
                          props: {
                            style: { display: 'flex', justifyContent: 'space-between' },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Stateroom / Property' } },
                                    { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold' }, children: bookingDetails.propertyName || 'Premium Suite' } },
                                  ]
                                }
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', width: '200px' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Status' } },
                                    { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold', color: '#073359' }, children: 'CONFIRMED (PAID)' } },
                                  ]
                                }
                              },
                            ]
                          }
                        },
                      ]
                    }
                  },
                  // RIGHT AREA (Stub & QR)
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        width: '30%',
                        borderLeft: '4px dashed #ccc',
                        padding: '20px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f4efe6',
                      },
                      children: [
                         // Real Scannable QR Code
                         {
                           type: 'div',
                           props: {
                             style: { width: '160px', height: '160px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ccc', borderRadius: '12px', overflow: 'hidden' },
                             children: {
                               type: 'img',
                               props: {
                                 src: `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=STAYQ-CONFIRMATION-${bookingDetails.confirmationCode || 'TEST'}`,
                                 style: { width: '140px', height: '140px' },
                               }
                             }
                           }
                         },
                         {
                           type: 'div',
                           props: {
                             style: { marginTop: '16px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' },
                             children: 'SCAN AT PIER'
                           }
                         },
                         // Barcode lines
                         {
                           type: 'div',
                           props: {
                             style: { marginTop: '24px', display: 'flex', height: '40px', width: '180px', backgroundColor: 'transparent' },
                             children: [
                               { type: 'div', props: { style: { width: '4px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '8px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '2px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '12px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '4px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '8px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '4px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '2px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '6px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '12px', height: '100%', backgroundColor: '#000', marginRight: '4px' }, children: '' } },
                               { type: 'div', props: { style: { width: '4px', height: '100%', backgroundColor: '#000' }, children: '' } },
                             ]
                           }
                         }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      } as any,
      {
        width: 1000,
        height: 400,
        fonts: [
          {
            name: 'Roboto',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    );

    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1000,
      },
    });
    const pngData = resvg.render();
    return pngData.asPng();
  }
}
