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
    const guestName = bookingDetails.guest?.displayName || bookingDetails.guest?.name || bookingDetails.guestName || 'Valued Guest';
    const propertyTitle = bookingDetails.property?.title || bookingDetails.propertyName || 'Stay Q Luxury Stay';
    const category = (bookingDetails.property?.category || bookingDetails.category || 'Luxury Stay').toString().replace(/_/g, ' ');
    const city = bookingDetails.property?.city || bookingDetails.city || '';
    const hostName = bookingDetails.property?.host?.displayName || bookingDetails.hostName || 'Stay Q Verified Host';
    const confCode = bookingDetails.confirmationCode || 'SQ-VIP';
    const checkInDate = bookingDetails.checkIn ? new Date(bookingDetails.checkIn) : null;
    const checkOutDate = bookingDetails.checkOut ? new Date(bookingDetails.checkOut) : null;
    const checkInStr = checkInDate ? checkInDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Confirmed';
    const checkOutStr = checkOutDate ? checkOutDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Confirmed';
    const amountStr = bookingDetails.totalAmount ? `PAID: ₹${Number(bookingDetails.totalAmount).toLocaleString('en-IN')}` : 'CONFIRMED (PAID)';

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
                    children: 'STAY Q | OFFICIAL DIGITAL STAY PASS'
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
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Host' } },
                                    { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold', color: '#073359' }, children: hostName.toUpperCase() } },
                                  ]
                                }
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', width: '200px' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Category & Destination' } },
                                    { type: 'span', props: { style: { fontSize: '18px', fontWeight: 'bold' }, children: city ? `${category.toUpperCase()} • ${city.toUpperCase()}` : category.toUpperCase() } },
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
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Guest Name' } },
                                    { type: 'span', props: { style: { fontSize: '22px', fontWeight: 'bold' }, children: guestName } },
                                  ]
                                }
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', width: '200px' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Confirmation Code' } },
                                    { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold' }, children: `#${confCode}` } },
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
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Check-in' } },
                                    { type: 'span', props: { style: { fontSize: '18px', fontWeight: 'bold' }, children: checkInStr } },
                                  ]
                                }
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', width: '200px' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Check-out' } },
                                    { type: 'span', props: { style: { fontSize: '18px', fontWeight: 'bold' }, children: checkOutStr } },
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
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Property / Stay' } },
                                    { type: 'span', props: { style: { fontSize: '20px', fontWeight: 'bold' }, children: propertyTitle } },
                                  ]
                                }
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { display: 'flex', flexDirection: 'column', width: '200px' },
                                  children: [
                                    { type: 'span', props: { style: { fontSize: '14px', color: '#555', marginBottom: '4px' }, children: 'Payment Status' } },
                                    { type: 'span', props: { style: { fontSize: '18px', fontWeight: 'bold', color: '#073359' }, children: amountStr } },
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
                                 src: `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=STAYQ-CONFIRMATION-${confCode}`,
                                 style: { width: '140px', height: '140px' },
                               }
                             }
                           }
                         },
                         {
                           type: 'div',
                           props: {
                             style: { marginTop: '16px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' },
                             children: 'SCAN FOR CHECK-IN'
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
