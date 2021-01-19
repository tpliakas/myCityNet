import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Switch } from 'antd';
import mapboxgl from 'mapbox-gl';
import { motion } from 'framer-motion';

mapboxgl.accessToken =
  'pk.eyJ1IjoidGhlb3Jpb3MiLCJhIjoiY2trMGY0OHI3MGdzeTJ2cXMwZHVhdDJnMiJ9.F3BOTpZILjuG5nCjGIQB7A';

const TicketMap = ({ onMapChange, tickets }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    setMap(
      new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/theorios/ckk0f38ha17aw17nljhjd23n8',
        center: [23.727539, 37.98381],
        zoom: 11
      })
    );
  }, []);

  const ticketsList = useMemo(() => {
    if (tickets) {
      const ticketsGeo = tickets
        .filter((ticket) => ticket.location !== '')
        .map((ticket, idx) => {
          const {
            address,
            addressNumber,
            area,
            city,
            location,
            title
          } = ticket;
          const image = ticket.images[0];

          let coordinates;
          if (location) {
            let coords = location.split(',');
            coordinates = [parseFloat(coords[0]), parseFloat(coords[1])];
          }

          return {
            id: idx,
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coordinates || []
            },
            image: image,
            properties: {
              address: address,
              addressNumber: addressNumber,
              city: city,
              area: area,
              title: title
            }
          };
        });

      return {
        type: 'FeatureCollection',
        features: ticketsGeo
      };
    }
  }, [tickets]);

  useEffect(() => {
    if (map && ticketsList) {
      map.on('load', (e) => {
        map.addLayer({
          id: 'locations',
          type: 'symbol',
          source: {
            type: 'geojson',
            data: ticketsList
          },
          layout: {
            'icon-image': 'ch-motorway-2',
            'icon-allow-overlap': true
          }
        });
      });
    }
  }, [map, ticketsList]);

  useEffect(() => {
    if (!ticketsList || !map) return;
    ticketsList.features.forEach((ticket, idx) => {
      const prop = ticket.properties;
      const { id } = ticket;

      const listings = document.getElementById('listings');
      const listing = listings.appendChild(document.createElement('a'));

      listing.id = 'listing-' + id;
      listing.className = 'item';
      listing.href = '#';
      listing.id = 'link-' + id;

      const title = listing.appendChild(document.createElement('span'));
      title.className = 'title';
      title.innerHTML = prop.title;

      const details = listing.appendChild(document.createElement('div'));
      details.innerHTML = `${prop.address} ${prop.addressNumber}, ${prop.area}, ${prop.city}`;

      listing.addEventListener('click', (e) => {
        flyToTicket(ticket);
        createPopUp(ticket);

        const activeItem = document.getElementsByClassName('active');
        if (activeItem[0]) {
          activeItem[0].classList.remove('active');
        }
        e.target.parentNode.classList.add('active');
      });
    });
  }, [ticketsList, map]);

  const flyToTicket = (currentFeature) => {
    if (!map) return;

    map.flyTo({
      center: currentFeature.geometry.coordinates,
      zoom: 15
    });
  };

  const createPopUp = useCallback(
    (currentFeature) => {
      if (!map) return;
      // Check for .remove() for older browsers
      if (!('remove' in Element.prototype)) {
        Element.prototype.remove = function () {
          if (this.parentNode) {
            this.parentNode.removeChild(this);
          }
        };
      }

      const popUps = document.getElementsByClassName('mapboxgl-popup');
      // Check if there is already a popup on the map and if so, remove it
      if (popUps[0]) popUps[0].remove();

      new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML(
          `<h3>${currentFeature.properties.title}</h3>
          <h4>${currentFeature.properties.address} ${
            currentFeature.properties.addressNumber
          }, ${currentFeature.properties.area}</h4>
          ${
            currentFeature.image
              ? `<img
                src=${currentFeature.image}
                width="100%"
                title="Ticket image"
                alt="Ticket image"
              />`
              : `<span />`
          }`
        )
        .addTo(map);
    },
    [map]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { duration: 1 }
      }}
      exit={{ opacity: 0, scale: 0 }}
    >
      <div className="map-wrapper">
        <div className="map-switch">
          <Switch
            onChange={onMapChange}
            checkedChildren="Map enabled"
            unCheckedChildren="Map disabled"
            defaultChecked
            autoFocus
          />
        </div>
        <div className="sidebar pad2">
          <div className="heading">
            <h1>Tickets List</h1>
          </div>
          <div id="listings" className="listings" />
        </div>
        <div id="map" className="map pad2">
          Map
        </div>
      </div>
    </motion.div>
  );
};

TicketMap.propTypes = {
  onMapChange: PropTypes.func.isRequired,
  tickets: PropTypes.array.isRequired
};

export default TicketMap;
